#!/usr/bin/env node
/**
 * CLI entry point for @ens-node-metadata/agent-registration.
 *
 * Usage:
 *   agent-registration validate <file.json>   — validate a registration JSON file
 *   agent-registration build                  — print a starter registration JSON template
 */
import { readFileSync } from 'node:fs'
import { buildRegistrationFile, validateRegistrationFile } from './index.js'

const [, , subcommand, ...rest] = process.argv

function printUsage(): void {
  console.error(`Usage:
  agent-registration validate <file.json>   Validate a registration JSON file
  agent-registration build                  Print a starter registration JSON template`)
}

function cmdValidate(args: string[]): void {
  const filePath = args[0]
  if (!filePath) {
    console.error('Error: validate requires a file path argument.')
    printUsage()
    process.exit(1)
  }

  let raw: unknown
  try {
    const contents = readFileSync(filePath, 'utf8')
    raw = JSON.parse(contents)
  } catch (err) {
    console.error(`Error reading file: ${(err as Error).message}`)
    process.exit(1)
  }

  const result = validateRegistrationFile(raw)
  if (result.success) {
    console.log('✅ Valid AgentRegistrationFile')
    process.exit(0)
  } else {
    console.error('❌ Invalid AgentRegistrationFile')
    for (const issue of result.error.issues) {
      const path = issue.path.length > 0 ? issue.path.join('.') : '(root)'
      console.error(`  [${path}] ${issue.message}`)
    }
    process.exit(1)
  }
}

function cmdBuild(): void {
  const template = buildRegistrationFile({
    name: 'My Agent',
    description: 'A brief description of what this agent does.',
    services: [
      {
        name: 'MCP',
        endpoint: 'https://example.com/mcp',
        version: '1.0',
      },
    ],
    x402Support: false,
    active: true,
    registrations: [],
    supportedTrust: ['none'],
  })
  console.log(JSON.stringify(template, null, 2))
}

switch (subcommand) {
  case 'validate':
    cmdValidate(rest)
    break
  case 'build':
    cmdBuild()
    break
  default:
    console.error(`Unknown subcommand: ${subcommand ?? '(none)'}`)
    printUsage()
    process.exit(1)
}
