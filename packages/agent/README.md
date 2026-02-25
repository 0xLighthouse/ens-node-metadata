# @ens-node-metadata/agent

CLI for registering AI agents on ENS using [ERC-8004](https://best-practices.8004scan.io/docs/01-agent-metadata-standard.html) (v2.0).

## Usage

```bash
pnpm dlx @ens-node-metadata/agent --help
```

## Commands

```
agent skill [--install]
  Print SKILL.md. With --install, copy it to the current directory.

agent registration-file template
  Print an empty ERC-8004 v2.0 registration JSON to stdout.

agent registration-file validate <registration-file.json>
  Validate against Zod schema. Prints ✅ or errors ❌.
  Emits WA031 deprecation warning if the legacy `endpoints` field is used.

agent registration-file publish <registration-file.json>
  Publish to IPFS via @web3-storage/w3up-client. Prints the ipfs:// URI.
  Requires: W3_PRINCIPAL, W3_PROOF env vars (see below).

agent registry identity --chain-name <chain> <agent-uri>
  Read the ERC-8004 Identity Registry for the given chain.
  Supported chains: base, mainnet.
  Requires: ERC8004_REGISTRY_<CHAIN> env var.

agent metadata template
  Print a starter ENS metadata payload JSON (the text records to set).

agent metadata validate <payload.json>
  Validate ENS metadata payload against the agent schema.

agent register <ENS> <payload.json> --private-key <key> [--broadcast]
  Build ENS setTextRecords transaction. Dry run by default; --broadcast submits it.
  Uses viem + @ensdomains/ensjs.

agent update <ENS> <payload.json> --private-key <key> [--broadcast]
  Same as register — for updating existing records.
```

## Environment Variables

### IPFS Publishing (`registration-file publish`)

| Variable | Description |
|---|---|
| `W3_PRINCIPAL` | Your DID key. Get it via: `w3 key create` (install `@web3-storage/w3cli`) |
| `W3_PROOF` | UCAN proof delegation from your web3.storage space. See [w3up docs](https://web3.storage/docs/how-to/create-space/) |

```bash
# Quick setup
npm install -g @web3-storage/w3cli
w3 login you@example.com
w3 space create my-agent
export W3_PRINCIPAL=$(w3 key create)
export W3_PROOF=$(w3 delegation create --can 'store/add' --can 'upload/add' | base64)
```

### On-chain Registry (`registry identity`)

| Variable | Description |
|---|---|
| `ERC8004_REGISTRY_MAINNET` | ERC-8004 registry contract address on mainnet |
| `ERC8004_REGISTRY_BASE` | ERC-8004 registry contract address on Base |

## ERC-8004 v2.0 Registration File

The registration file is a JSON document published to IPFS or HTTPS. Its `ipfs://` URI is stored as the `agent-uri` ENS text record.

```json
{
  "type": "Agent",
  "name": "My Agent",
  "description": "Does useful things on-chain.",
  "services": [
    { "name": "MCP", "endpoint": "https://myagent.example.com/mcp", "version": "1.0" },
    { "name": "A2A", "endpoint": "https://myagent.example.com/a2a", "version": "0.3" }
  ],
  "x402Support": false,
  "active": true,
  "registrations": [],
  "supportedTrust": ["reputation"]
}
```

> ⚠️ **v2.0 migration:** The field name changed from `endpoints` → `services` (Jan 2026).
> The CLI accepts `endpoints` for backward compatibility with a WA031 deprecation warning.

## Registration Flow

1. `agent registration-file template > registration.json` — create the file
2. Edit `registration.json`
3. `agent registration-file validate registration.json` — validate
4. `agent registration-file publish registration.json` — publish to IPFS → get `ipfs://` URI
5. `agent metadata template > payload.json` — create the ENS record payload
6. Set `agent-uri` to the `ipfs://` URI in `payload.json`
7. `agent metadata validate payload.json` — validate
8. `agent register myagent.eth payload.json --private-key $PK --broadcast` — register

See [SKILL.md](./SKILL.md) for the full step-by-step guide.

## TypeScript API

```ts
import {
  buildRegistrationFile,
  validateRegistrationFile,
  AgentRegistrationFileSchema,
} from "@ens-node-metadata/agent";

// Build a registration file
const file = buildRegistrationFile({
  name: "My AI Agent",
  description: "Does useful things on-chain.",
  services: [
    { name: "MCP", endpoint: "https://myagent.example.com/mcp", version: "1.0" },
  ],
  active: true,
  supportedTrust: ["reputation"],
});

// Validate an untrusted payload
const raw = JSON.parse(maybeInvalidJson);
const result = validateRegistrationFile(raw);
if (result.success) {
  console.log(result.data.name);
  // Check for legacy `endpoints` field usage
  if (result.data._legacyEndpoints) {
    console.warn("WA031: migrate from `endpoints` to `services`");
  }
}
```

## Related Packages

- [`@ens-node-metadata/schemas`](../schemas) — JSON schemas for all ENS node types
- [`@ens-node-metadata/sdk`](../sdk) — ENS metadata read SDK
