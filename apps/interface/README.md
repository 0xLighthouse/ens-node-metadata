# Interface

This interface was designed to work with minimal infrastructure so you can run it locally if you wish.

## Environment

The interface expects the following environment variables to be set.

```sh
export NEXT_PUBLIC_PRIVY_APP_ID=
export NEXT_PUBLIC_RPC_URL=<MAINNET_RPC>
export DUNE_API_KEY=
```

## Getting Started

```bash
pnpm dev
```

## Libraries

- `@ensdomains/ensjs` for on-chain writes
- `zustand` for managing state
- `@xyflow/react` + `@dagrejs/dagre` for rendering the node tree
- `shadcn` for UI components
- `vaul` for drawers

### Adding UI components

```sh
# Example
pnpm dlx shadcn add button
```

## Supported Operations

The following on-chain writes are supported via `@ensdomains/ensjs`:

- **Set records** — Batch update text records and coin records (ETH only for now) for any ENS name
- **Create subname** — Register a new subdomain under a parent name, supporting both the Name Wrapper and legacy registry

## How it works

The interface is built around a simple editing loop:

1. **Query** — We fetch the full ENS subgraph history for a domain tree. Because this data is sourced from on-chain events, it's trustworthy and used as the source of truth.
2. **Mutate locally** — All edits (text record changes, new nodes, deletions) are tracked as local deltas. You can freely expand the tree, attach schemas, and update records without touching the chain.
3. **Apply on-chain** — When ready, the accumulated deltas are reviewed and submitted as a batched on-chain write, keeping the changeset clean and minimal.
