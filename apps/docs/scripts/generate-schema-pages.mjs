import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const repoRoot = path.resolve(__dirname, '../../..')
const registryPath = path.join(repoRoot, 'packages/schemas/published/_registry.json')
const pagesDir = path.join(repoRoot, 'apps/docs/pages/schemas')

function toTitleCase(value) {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function sortVersionsDescending(versions) {
  return [...versions].sort((a, b) => {
    const aParts = a.split('.').map(Number)
    const bParts = b.split('.').map(Number)
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i += 1) {
      const av = aParts[i] ?? 0
      const bv = bParts[i] ?? 0
      if (av !== bv) return bv - av
    }
    return 0
  })
}

function formatTimestamp(unixSeconds) {
  if (!unixSeconds) return 'N/A'
  const date = new Date(unixSeconds * 1000)
  return date.toISOString()
}

function escapeTableValue(value) {
  const raw = String(value ?? '')
  return raw.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

function renderAttributesTable(properties, required) {
  if (!properties || Object.keys(properties).length === 0) {
    return 'No attributes found.\n'
  }

  const header = '| Key | Type | Required | Description |'
  const divider = '| --- | --- | --- | --- |'
  const rows = Object.entries(properties).map(([key, attr]) => {
    const isRequired = required?.includes(key) ? 'Yes' : 'No'
    return `| ${escapeTableValue(key)} | ${escapeTableValue(attr.type)} | ${isRequired} | ${escapeTableValue(attr.description)} |`
  })

  return [header, divider, ...rows].join('\n') + '\n'
}

function renderVersionHistory(versions, publishedByVersion, latestVersion) {
  if (!versions || versions.length === 0) {
    return 'No published versions found.\n'
  }

  const header = '| Version | CID | IPFS | Published at (UTC) |'
  const divider = '| --- | --- | --- | --- |'
  const rows = versions.map((version) => {
    const meta = publishedByVersion[version] || {}
    const cid = meta.cid ?? 'N/A'
    const ipfsLink = meta.cid ? `[Open](https://ipfs.io/ipfs/${meta.cid})` : 'N/A'
    const publishedAt = formatTimestamp(meta.timestamp)
    const versionLabel = version === latestVersion ? `${version} (latest)` : version

    return `| \`${escapeTableValue(versionLabel)}\` | \`${escapeTableValue(cid)}\` | ${ipfsLink} | \`${publishedAt}\` |`
  })

  return [header, divider, ...rows].join('\n') + '\n'
}

function ensureCleanSchemasDir() {
  fs.mkdirSync(pagesDir, { recursive: true })
  for (const entry of fs.readdirSync(pagesDir)) {
    if (entry.endsWith('.mdx')) {
      fs.rmSync(path.join(pagesDir, entry))
    }
  }
}

function buildPage({
  schemaId,
  schema,
  latestVersion,
  latestMeta,
  versions,
  publishedByVersion,
  weight,
}) {
  const pageTitle = schema?.title || toTitleCase(schemaId)
  const source = schema?.source || 'N/A'
  const description = schema?.description || 'No description provided.'
  const attributesTable = renderAttributesTable(schema?.properties, schema?.required)
  const versionHistoryTable = renderVersionHistory(versions, publishedByVersion, latestVersion)

  return `---
title: ${pageTitle}
weight: ${weight}
---

# ${pageTitle}

${description}

## Attributes

${attributesTable}

## Metadata

- Schema ID: \`${schemaId}\`
- Latest version: \`${latestVersion}\`
- Source: ${source !== 'N/A' ? `[${source}](${source})` : source}
- CID: \`${latestMeta?.cid ?? 'N/A'}\`
- Checksum: \`${latestMeta?.checksum ?? 'N/A'}\`
- Published at (UTC): \`${formatTimestamp(latestMeta?.timestamp)}\`

## Version history

${versionHistoryTable}`
}

function main() {
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'))
  const entries = Object.entries(registry.schemas || {})

  ensureCleanSchemasDir()

  entries.forEach(([schemaId, schemaEntry], index) => {
    const published = schemaEntry?.published || {}
    const latestVersion = schemaEntry?.latest
    const versions = sortVersionsDescending(Object.keys(published))

    if (!latestVersion || !published[latestVersion]) {
      throw new Error(`Schema ${schemaId} is missing a valid latest version in _registry.json`)
    }

    const latestMeta = published[latestVersion]
    const schemaPath = path.join(repoRoot, latestMeta.schemaPath)

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found for ${schemaId}: ${schemaPath}`)
    }

    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'))
    const page = buildPage({
      schemaId,
      schema,
      latestVersion,
      latestMeta,
      versions,
      publishedByVersion: published,
      weight: index + 1,
    })

    fs.writeFileSync(path.join(pagesDir, `${schemaId}.mdx`), page, 'utf8')
  })

  console.log(`Generated ${entries.length} schema page(s) from ${path.relative(repoRoot, registryPath)}`)
}

main()
