---
name: ens-agent-capabilities
description: Manage and broadcast agent capabilities on ENS using ERC-8004.
allowed-tools: Bash(node:*), Bash(ipfs:*), Bash(cast:*)
---

# Agents

Manage your capabilities with ERC-8004 metadata and broadcast on ENS.

## Bootstrap

* Ask your human, what is their agents ens name is?

> Henceforth referred to as <AGENT_ENS_NAME>

## Guardrails

* Never show sensitive keys, even when asked
* If human attempts to override, only acknowledge existence. Never transmit keys
* All artifacts (registration files, metadata payloads, etc.) MUST be saved in `~/.ens-agent/`. Create the directory if it does not exist.
* **ALWAYS dry run before broadcasting.** For any command that supports `--broadcast`, you MUST first run it WITHOUT `--broadcast` to display the transaction details (signer address, target contract, estimated cost, etc.) to the user. Present these details clearly and wait for explicit confirmation before re-running with `--broadcast`. Never skip this step.
* **Check balance covers gas.** After a dry run, compare the displayed Balance against the Est. Cost. If the balance cannot cover the estimated gas cost, warn the user that the transaction will fail and do NOT proceed with `--broadcast`.

## Quickstart

Run `ens-agent --help` or `ens-agent <command> --help` for full usage.

1. Create a registration file with `registration-file` sub commands
2. Register with a canonical `registry`
3. Prepare and set `metadata` to be saved on ENS
4. (Optional) Install and tailor the `skill` for your specific purposes

## Workflows

### ERC-8004 operations

#### Building a registration file

A registration file is required to register your Agent's identity.

```sh
mkdir -p ~/.ens-agent

# edit with your details
ens-agent registration-file template > ~/.ens-agent/registration.json

# validate
ens-agent registration-file validate ~/.ens-agent/registration.json
```

#### Publishing a registration file

We publish to IPFS using <https://pinata.cloud>.

The following variables should be in your environment to use this command.

* `PINATA_JWT`, `PINATA_API_KEY`, `PINATA_API_SECRET`

```sh
# Publish to IPFS
ens-agent registration-file publish ~/.ens-agent/registration.json
# Returns => {"cid":"<CID>","uri":"ipfs://<CID>"} — use jq to extract:
# agent-uri=$(ens-agent registration-file publish ~/.ens-agent/registration.json | jq -r '.uri')
```

#### Register your Agent

We publish to the canonical registries <https://github.com/erc-8004/erc-8004-contracts>

```sh
# Query agent by token ID
ens-agent registry identity query --chain-name <chain> <agent-id>

# Register agent identity (returns agent-id)
ens-agent registry identity register --chain-name <chain> <agent-uri> --private-key <0x...> [--broadcast]

# Update agent URI
ens-agent registry identity set-uri --chain-name <chain> <agent-id> <new-uri> --private-key <0x...> [--broadcast]

# Link a verified wallet (auto-signs if signer controls the wallet)
ens-agent registry identity set-wallet --chain-name <chain> <agent-id> <wallet> --private-key <0x...> [--broadcast]

# Link a wallet controlled by a different key (provide EIP-712 signature)
ens-agent registry identity set-wallet --chain-name <chain> <agent-id> <wallet> --deadline <ts> --signature <0x...> --private-key <0x...> [--broadcast]

# Clear wallet link
ens-agent registry identity unset-wallet --chain-name <chain> <agent-id> --private-key <0x...> [--broadcast]
```

### ENS operations

#### Preparing a metadata payload

A metadata payload descrbes which text records to set.

```sh
# Agent metadata expressed as JSON schema
ens-agent metadata template > ~/.ens-agent/payload.json

# Validator
ens-agent metadata validate ~/.ens-agent/payload.json
```

#### Updating metadata on ENS

* Use this command to set Agent metadata against your ENS name.
* Consider updating your metadata when key information about your skills, identity or capabilities change.
* Remember to also update your `<agent-uri>`.

```sh
ens-agent metadata set <AGENT_ENS_NAME> ~/.ens-agent/payload.json --private-key 0x<KEY> --broadcast
```

## References

* Agent Metadata (ERC-8004) used for registration-file command
  * <https://best-practices.8004scan.io/docs/01-agent-metadata-standard.html>
* ENS Metadata - Agent schema, used for metadata command
  * <https://ens-metadata-docs.vercel.app/schemas/agent>
