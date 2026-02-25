# @ens-node-metadata/agent-registration

Utilities and documentation for registering an AI agent on ENS using the [ERC-8004](https://ens-metadata-docs.vercel.app/schemas/agent) standard.

## Overview

ERC-8004 defines a JSON schema for describing AI agents that are addressable via ENS. This package provides:

- **TypeScript types** for the registration file schema
- **`buildRegistrationFile`** — constructs a valid registration file with defaults
- **`validateRegistrationFile`** — type-safe runtime validator
- **`SKILL.md`** — machine-readable instructions for agents to self-register

## Installation

This is a private workspace package. It is available to any package in the monorepo via:

```json
"dependencies": {
  "@ens-node-metadata/agent-registration": "workspace:*"
}
```

## Usage

```ts
import {
  buildRegistrationFile,
  validateRegistrationFile,
} from "@ens-node-metadata/agent-registration";

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
if (validateRegistrationFile(raw)) {
  // raw is now typed as AgentRegistrationFile
  console.log(raw.name);
}
```

## Types

```ts
interface AgentService {
  name: string;
  endpoint: string;
  version?: string;
}

interface AgentRegistration {
  agentId: string;
  agentRegistry: string;
}

interface AgentRegistrationFile {
  type: "Agent";
  name: string;
  description: string;
  image?: string;
  services: AgentService[];
  x402Support: boolean;
  active: boolean;
  registrations: AgentRegistration[];
  supportedTrust: string[];
}
```

## Agent Instructions

See [`SKILL.md`](./SKILL.md) for step-by-step instructions on:

1. Building the registration file
2. Publishing to IPFS or HTTPS
3. Writing ENS text records (`class`, `agent-uri`, `service[MCP]`, …)
4. Keeping records up to date

## Example

See [`examples/registration.json`](./examples/registration.json) for a complete example registration file.

## Schema Reference

https://ens-metadata-docs.vercel.app/schemas/agent

## Related Packages

- [`@ensipXX/sdk`](../sdk) — ENS metadata read/write SDK
- [`@ens-node-metadata/schemas`](../schemas) — JSON schemas
