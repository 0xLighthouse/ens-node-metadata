# ENS: Metadata

## Getting started

### Local development

```shell
# tty0 (root)
# Produce a block every 5 secs
anvil --block-time 5

# tty1 (root)
# Setup development environment (uniswap, signals, txns etc)
bash scripts/dev.sh

# tty1 (app/indexers)
# Start indexer
yarn dev
```

***

## Installation

This is a monorepo contains an `apps/` directory which contains our source code. In this directory you will find:

| Component | Description |
|-----------|-------------|
| `contracts` | Our solidity smart contracts ([Docs](apps/contracts/README.md)) |
| `interface` | Our next.js web UI for interacting with the contracts ([Docs](apps/interface/README.md)) |
| `simulations` | A start at running monte carlo simulations to prove the effectiveness of different weight curves (WIP - ignore for now) |

Each of these folders has its own readme for more technical details.

## Usage

Visit [https://harbor.testnet.lighthouse.cx/](https://harbor.testnet.lighthouse.cx/) to explore the protocol.

* Grab some testnet ETH at <https://docs.arbitrum.io/for-devs/dev-tools-and-resources/chain-info#faucets>
* You can then use our built in faucet to claim some `SGNL` (our governance token) and `Mocked USDC` (our reward token) to use on the frontend.
