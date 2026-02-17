# ENSIP Schemas

This packages helps with the management of publishing ENSIP-XX schema JSON, signing (EIP-712), and tracking latest versions.

## Overview

- Schemas live in `packages/schemas/src/*.ts` and expose a `Schema` object with `version`.
- Publishing creates versioned artifacts under `packages/schemas/published/` and records a signed run log.
- `--bump` is optional. If omitted, the current version is reused. The script **refuses** to publish a version that already exists.

## Environment variables

If publishing a schema we expect the following environment variables to be avaliable.

```sh
export SCHEMA_PUBLISHER_PRIVATE_KEY=
export PINATA_API_KEY=
export PINATA_API_SECRET=
export PINATA_JWT=
```

## Command

```bash
pnpm publish:schema --id org

# Publish and bump version
pnpm publish:schema --id org --bump (patch|minor|major)
```

## Outputs (per publish)

```sh
packages/schemas/published/
  _latest.json                # map of schemaId → latest {version,cid,checksum,timestamp,signer,signature,eip712}
  _registry.json              # full registry with all published versions
  {schemaId}/
    versions/{version}/
      schema.json             # exported Schema
      checksum.sha256
      cid.txt
      meta.json               # includes signer, signature, eip712 payload
    runs/ipfs/
      run-<unix>.json         # append-only log (signed)
      run-latest.json
    index.json                # per-schema list with latest pointer
```

## Behavior & safety

- Refuses to publish if `{schemaId}@{version}` is already recorded.
- Schemas are EIP-712 signed, check run files, for easy verification.
