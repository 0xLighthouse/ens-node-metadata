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
- [ ] `ens-agent registry identity --chain-name <chain> <agent-uri> --private-key <0x...> [--broadcast]`
- [x] `ens-agent metadata template`
- [x] `ens-agent metadata validate <payload>`
- [ ] `ens-agent metadata set <AGENT_ENS_NAME> <payload> --private-key <0x...> [--broadcast]`
- [ ] `ens-agent skill [--install]`

## Related Packages

- [`@ens-node-metadata/schemas`](#TODO) — JSON schemas for all ENS node types
- [`@ens-node-metadata/sdk`](https://www.npmjs.com/package/@ens-node-metadata/sdk) — ENS metadata read SDK
