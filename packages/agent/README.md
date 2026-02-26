# @ens-node-metadata/agent

CLI for registering AI agents on ENS using [ERC-8004](https://best-practices.8004scan.io/docs/01-agent-metadata-standard.html) (v2.0).

## Agent prompt

Paste this into your AI assistant after [reading the code](https://github.com/0xLighthouse/ens-node-metadata/tree/develop/packages/agent).

```bash
To manage your ERC-8004 metadata with ENS, use the following command:

pnpm dlx @ens-node-metadata/agent --help
```

## Registration Flow

See [SKILL.md](./SKILL.md) for the full step-by-step guide.

## Roadmap

- [x] `ens-agent registration-file template`
- [x] `ens-agent registration-file validate <file>`
- [x] `ens-agent registration-file publish <file>`
- [x] `ens-agent registry identity query --chain-name <chain> <agent-id>`
- [x] `ens-agent registry identity register --chain-name <chain> <agent-uri> --private-key <0x...> [--broadcast]`
- [x] `ens-agent registry identity set-uri --chain-name <chain> <agent-id> <new-uri> --private-key <0x...> [--broadcast]`
- [x] `ens-agent registry identity set-wallet --chain-name <chain> <agent-id> <wallet> --private-key <0x...> [--deadline <ts>] [--signature <0x...>] [--broadcast]`
- [x] `ens-agent registry identity unset-wallet --chain-name <chain> <agent-id> --private-key <0x...> [--broadcast]`
- [x] `ens-agent metadata template`
- [x] `ens-agent metadata validate <payload>`
- [x] `ens-agent metadata set <AGENT_ENS_NAME> <payload> --private-key <0x...> [--broadcast]`
- [ ] `ens-agent skill [--install]`

## Upcoming

### Reputation Registry

- [ ] `ens-agent registry reputation give` — leave feedback for an agent
- [ ] `ens-agent registry reputation revoke` — revoke your feedback
- [ ] `ens-agent registry reputation read` — read a specific feedback entry
- [ ] `ens-agent registry reputation summary` — aggregated score (count + value)

### Validation Registry (under active discussion)

- [ ] `ens-agent registry validation request` — request validation for an agent
- [ ] `ens-agent registry validation respond` — validator submits response
- [ ] `ens-agent registry validation status` — check validation status

## Related Packages

- [`@ens-node-metadata/schemas`](#TODO) — JSON schemas for all ENS node types
- [`@ens-node-metadata/sdk`](https://www.npmjs.com/package/@ens-node-metadata/sdk) — ENS metadata read SDK
