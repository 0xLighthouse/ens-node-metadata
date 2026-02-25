---
name: agent-self-registration
description: Skill for registering an AI agent on ENS using ERC-8004. Covers the CLI commands, building the registration file, publishing it to IPFS, writing ENS text records, and keeping them up to date.
allowed-tools: Bash(node:*), Bash(ipfs:*), Bash(cast:*)
---

# Agent Self-Registration (ERC-8004)

This skill teaches an agent how to register itself on ENS using the ERC-8004 standard. The full schema is documented at:

> https://ens-metadata-docs.vercel.app/schemas/agent

---

## CLI Quick Reference

All commands are available via the `agent` binary from `@ens-node-metadata/agent`.

```
agent skill [--install]
  Print SKILL.md to stdout. Pass --install to copy it to ./SKILL.md.

agent registration-file template
  Print an empty ERC-8004 v2.0 JSON registration file template.

agent registration-file validate <file.json>
  Validate a registration file against the Zod schema. Exits non-zero on failure.

agent registration-file publish <file.json>
  Upload the registration file to IPFS via web3.storage.
  Requires: W3_PRINCIPAL and W3_PROOF env vars.
  Prints the resulting ipfs:// URI on success.

agent registry identity --chain-name <chain> <agent-uri>
  Read the on-chain identity for an agent URI from an ERC-8004 registry.
  chain: base | mainnet (default: mainnet)
  Requires: ERC8004_REGISTRY_<CHAIN> env var set to the registry contract address.

agent metadata template
  Print an empty ENS text record payload template (flat key/value JSON).

agent metadata validate <payload.json>
  Validate a metadata payload against the agent schema. Exits non-zero on failure.

agent register <ENS> <payload.json> --private-key <0x...> [--broadcast]
  Set ENS text records for the agent. Default is a dry run; add --broadcast to submit on-chain.

agent update <ENS> <payload.json> --private-key <0x...> [--broadcast]
  Update ENS text records for an already-registered agent. Identical to register but
  semantically signals an update operation.
```

---

## Prerequisites

These are **not enforced** by the skill but must be satisfied before proceeding:

| Requirement | Why |
|---|---|
| ENS name ownership or control | You must be the controller of the ENS name to set text records |
| Wallet with signing capability | Needed to sign and broadcast transactions |
| ETH for gas on the target chain | Text-record writes are on-chain transactions |
| web3.storage account (W3_PRINCIPAL + W3_PROOF) | Required for IPFS publishing via `registration-file publish` |

---

## Step 1 — Build the Registration File

### Option A — CLI (recommended)

```bash
# Print an empty template
agent registration-file template > registration.json

# Edit registration.json with your details, then validate:
agent registration-file validate registration.json
```

### Option B — Programmatic API

```ts
import { buildRegistrationFile } from "@ens-node-metadata/agent";

const file = buildRegistrationFile({
  name: "My AI Agent",
  description: "An agent that does X, Y, Z.",
  services: [
    { name: "MCP",  endpoint: "https://myagent.example.com/mcp",  version: "1.0" },
    { name: "A2A",  endpoint: "https://myagent.example.com/a2a",  version: "0.3" },
    { name: "ENS",  endpoint: "https://myagent.example.com/ens-resolver" },
  ],
  x402Support: false,
  active: true,
  registrations: [],
  supportedTrust: ["reputation"],
});

console.log(JSON.stringify(file, null, 2));
```

### Schema fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | `"Agent"` | ✅ | Always `"Agent"` — set automatically by the helper |
| `name` | string | ✅ | Human-readable agent name |
| `description` | string | ✅ | What the agent does |
| `image` | string (URL) | ❌ | IPFS or HTTPS URL to agent avatar |
| `services` | `AgentService[]` | ✅ | Protocol endpoints (MCP, A2A, ENS, …) |
| `x402Support` | boolean | ✅ | `true` if the agent accepts x402 micro-payments |
| `active` | boolean | ✅ | `false` to signal the agent is offline/retired |
| `registrations` | `AgentRegistration[]` | ✅ | On-chain registry references |
| `supportedTrust` | string[] | ✅ | e.g. `["reputation", "attestation", "stake", "none"]` |

> ⚠️ **Deprecation (WA031):** The legacy `endpoints` field is accepted for backward compatibility but will trigger a deprecation warning. Always use `services` in new files.

---

## Step 2 — Publish the Registration File

The result of publishing is the **`agent-uri`** — an IPFS CID or HTTPS URL. This goes into the ENS text record `agent-uri`.

### Option A — CLI via web3.storage (preferred)

```bash
export W3_PRINCIPAL="<your-ed25519-principal-did>"
export W3_PROOF="<your-base64-encoded-proof>"

agent registration-file publish registration.json
# → ✅ Published to IPFS
# → ipfs://bafybeig...
```

### Option B — IPFS CLI

```bash
ipfs add --cid-version=1 registration.json
# → CID: bafybeig...
# agent-uri = ipfs://bafybeig...
```

### Option C — HTTPS

```bash
curl -X PUT https://my-s3-bucket.s3.amazonaws.com/agent/registration.json \
  --upload-file registration.json
# agent-uri = https://my-s3-bucket.s3.amazonaws.com/agent/registration.json
```

---

## Step 3 — Write ENS Text Records

### Option A — CLI (recommended)

```bash
# Dry run (no on-chain write)
agent register myagent.eth payload.json --private-key 0x<KEY>

# Broadcast on-chain
agent register myagent.eth payload.json --private-key 0x<KEY> --broadcast
```

### Option B — Programmatic (viem)

```ts
import { createWalletClient, http, namehash } from "viem";
import { mainnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const ENS_PUBLIC_RESOLVER = "0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63"; // mainnet

const resolverAbi = [
  {
    name: "setText",
    type: "function",
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "key",  type: "string"  },
      { name: "value",type: "string"  },
    ],
  },
] as const;

const client = createWalletClient({
  account: privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`),
  chain: mainnet,
  transport: http(),
});

const node = namehash("myagent.eth");

async function setRecord(key: string, value: string) {
  return client.writeContract({
    address: ENS_PUBLIC_RESOLVER,
    abi: resolverAbi,
    functionName: "setText",
    args: [node, key, value],
  });
}

await setRecord("class",          "Agent");
await setRecord("agent-uri",      agentUri);
await setRecord("name",           file.name);
await setRecord("description",    file.description);
await setRecord("active",         String(file.active));
await setRecord("supported-trust",file.supportedTrust.join(","));
await setRecord("agent-wallet",   client.account.address);

for (const svc of file.services) {
  await setRecord(`service[${svc.name}]`, svc.endpoint);
}
```

### ENS text record reference

| Key | Value | Required |
|---|---|---|
| `class` | `"Agent"` | ✅ |
| `agent-uri` | IPFS or HTTPS URL to registration file | ✅ |
| `name` | Agent name | Recommended |
| `description` | Short description | Recommended |
| `active` | `"true"` or `"false"` | Recommended |
| `supported-trust` | Comma-separated trust models | Recommended |
| `agent-wallet` | Ethereum address of the agent's hot wallet | Recommended |
| `service[MCP]` | MCP endpoint URL | Per service |
| `service[A2A]` | A2A endpoint URL | Per service |
| `service[ENS]` | ENS resolver endpoint URL | Per service |

---

## Step 4 — Validate

```bash
# Validate a registration file
agent registration-file validate registration.json

# Validate an ENS metadata payload
agent metadata validate payload.json
```

Or programmatically:

```ts
import { validateRegistrationFile } from "@ens-node-metadata/agent";

const raw = JSON.parse(fs.readFileSync("registration.json", "utf8"));
const result = validateRegistrationFile(raw);
if (!result.success) {
  console.error(result.error.issues);
}
if (result.success && result.data._legacyEndpoints) {
  console.warn("⚠️ WA031: migrate `endpoints` → `services`");
}
```

---

## Step 5 — Update Flow

### When to update **only text records** (cheap)

```bash
# Update active status
agent update myagent.eth active-only.json --private-key 0x<KEY> --broadcast
```

### When to re-publish and update `agent-uri` (content changed)

1. Edit the registration file
2. `agent registration-file validate registration.json`
3. `agent registration-file publish registration.json` → new CID
4. Update `agent-uri` in your payload JSON
5. `agent update myagent.eth payload.json --private-key 0x<KEY> --broadcast`

---

## Step 6 — Check On-Chain Identity

```bash
# Query mainnet ERC-8004 registry
export ERC8004_REGISTRY_MAINNET=0x<registry-contract-address>
agent registry identity --chain-name mainnet ipfs://bafybeig...
```

---

## Example

See [`examples/registration.json`](./examples/registration.json) for a complete, realistic registration file.
