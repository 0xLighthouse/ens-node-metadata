---
name: agent-self-registration
description: Skill for registering an AI agent on ENS using ERC-8004. Covers building the registration file, publishing it, writing ENS text records, and keeping them up to date.
allowed-tools: Bash(node:*), Bash(ipfs:*), Bash(cast:*)
---

# Agent Self-Registration (ERC-8004)

This skill teaches an agent how to register itself on ENS using the ERC-8004 standard. The full schema is documented at:

> https://ens-metadata-docs.vercel.app/schemas/agent

---

## Prerequisites

These are **not enforced** by the skill but must be satisfied before proceeding:

| Requirement | Why |
|---|---|
| ENS name ownership or control | You must be the controller of the ENS name to set text records |
| Wallet with signing capability | Needed to sign and broadcast transactions |
| ETH for gas on the target chain | Text-record writes are on-chain transactions |
| IPFS node or Pinata/NFT.Storage API key | Required for IPFS publishing (preferred) |

---

## Step 1 — Build the Registration File

Use `buildRegistrationFile` from `@ens-node-metadata/agent-registration` to construct a valid ERC-8004 JSON file.

```ts
import { buildRegistrationFile } from "@ens-node-metadata/agent-registration";

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
  registrations: [],          // add on-chain registry entries if applicable
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

---

## Step 2 — Publish the Registration File

The result of publishing is the **`agent-uri`** — an IPFS CID or HTTPS URL. This goes into the ENS text record `agent-uri`.

### Option A — IPFS (preferred, more decentralised)

IPFS gives content-addressable, censorship-resistant hosting. Recommended for production agents.

```bash
# Using the IPFS CLI
ipfs add --cid-version=1 registration.json
# → CID: bafybeig...
# agent-uri = ipfs://bafybeig...

# Using Pinata (HTTP API)
curl -X POST https://api.pinata.cloud/pinning/pinFileToIPFS \
  -H "Authorization: Bearer $PINATA_JWT" \
  -F "file=@registration.json"
# → IpfsHash in response
# agent-uri = ipfs://<IpfsHash>
```

Keep the CID. Every time you change the file you'll get a new CID — update `agent-uri` accordingly (see Step 5).

### Option B — HTTPS

Simpler but centralised. Suitable for development or when IPFS is not available.

```bash
# Deploy to any public HTTPS host, e.g.:
curl -X PUT https://my-s3-bucket.s3.amazonaws.com/agent/registration.json \
  --upload-file registration.json
# agent-uri = https://my-s3-bucket.s3.amazonaws.com/agent/registration.json
```

Make sure the URL is publicly reachable and returns `Content-Type: application/json`.

---

## Step 3 — Write ENS Text Records

Use viem's `writeContract` with the Public Resolver ABI (same pattern as `packages/sdk`).

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

// Core registration records
await setRecord("class",          "Agent");
await setRecord("agent-uri",      agentUri);           // ipfs://... or https://...

// Optional but recommended
await setRecord("name",           file.name);
await setRecord("description",    file.description);
await setRecord("active",         String(file.active));
await setRecord("supported-trust",file.supportedTrust.join(","));
await setRecord("agent-wallet",   client.account.address);

// Service endpoints (one record per protocol)
for (const svc of file.services) {
  await setRecord(`service[${svc.name}]`, svc.endpoint);
}
```

### Text record reference

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

Before publishing, validate the file:

```ts
import { validateRegistrationFile } from "@ens-node-metadata/agent-registration";

const raw = JSON.parse(fs.readFileSync("registration.json", "utf8"));
if (!validateRegistrationFile(raw)) {
  throw new Error("Invalid registration file — check all required fields");
}
```

---

## Step 5 — Update Flow

### When to update **only text records** (cheap)

Text-record-only updates are appropriate when:

- Toggling `active` status (e.g. the agent is going offline for maintenance)
- Updating a service endpoint URL without changing the schema
- Adding `agent-wallet` or other metadata that is not in the registration file

```ts
await setRecord("active", "false");
```

### When to re-publish the registration file and update `agent-uri` (more expensive)

Re-publish whenever the **content** of the registration file changes:

- Adding or removing services
- Changing trust models
- Updating `description` or `image`
- Any change to `registrations`

Workflow:

1. Edit the registration file
2. Run `validateRegistrationFile` — fail fast
3. Publish to IPFS → new CID
4. Update `agent-uri` text record with the new CID
5. Optionally sync other text records that changed (e.g. `active`, `description`)

---

## Example

See [`examples/registration.json`](./examples/registration.json) for a complete, realistic registration file.
