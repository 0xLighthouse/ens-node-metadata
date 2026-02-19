# @ens-node-metadata/schemas

A package for managing and publishing ENSIP schema definitions to IPFS.

Explore existing schemas <https://ens-metadata-docs.vercel.app/schemas/agent>

## Overview

Schemas are organized into two categories:

- **Community schemas** — managed in `src/schemas`
- **ENSIP-denoted schemas** — managed in `src/globals`

Each published schema is versioned, checksummed, and signed with an EIP-712 payload before being pinned to IPFS.

## Usage

```bash
# Publish a schema by ID
pnpm publish:schema --id org

# Publish and bump the version
pnpm publish:schema --id org --bump (patch|minor|major)

# Publish all common ENSIPs as a global collection
pnpm publish:globals
```

## Environment Variables

The following environment variables are required when publishing:

```sh
SCHEMA_PUBLISHER_PRIVATE_KEY=
PINATA_API_KEY=
PINATA_API_SECRET=
PINATA_JWT=
```

## Output Structure

Published artifacts are written to `packages/schemas/published/`:

```sh
published/
  _latest.json              # Map of schemaId → latest { version, cid, checksum, timestamp, signer, signature, eip712 }
  _registry.json            # Full registry across all published versions
  {schemaId}/
    versions/{version}/
      schema.json           # Exported schema
      checksum.sha256
      cid.txt
      meta.json             # Signer, signature, and EIP-712 payload
    runs/ipfs/
      run-<unix>.json       # Append-only signed publish log
      run-latest.json
    index.json              # Per-schema version list with latest pointer
```

## Behavior

- Publishing is **idempotent by version** — if `{schemaId}@{version}` has already been published, the command will refuse to overwrite it.
- All schemas are **EIP-712 signed**. Inspect any `run-*.json` file to verify a publish.
