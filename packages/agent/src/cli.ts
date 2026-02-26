#!/usr/bin/env node
import Pastel from 'pastel'

const args = process.argv.slice(2)
const isRootHelp =
  args.length === 0 || (args.length === 1 && (args[0] === '--help' || args[0] === '-h'))

if (isRootHelp) {
  console.log(`
CLI for registering AI agents on ENS using ERC-8004 (v2.0).

Usage:
  ens-agent skill [--install]

  ens-agent registration-file template
  ens-agent registration-file validate <file.json>
  ens-agent registration-file publish <file.json>

  ens-agent registry identity                       (show sub-commands)
  ens-agent registry identity query                  --chain-name <chain> <agent-id>
  ens-agent registry identity register               --chain-name <chain> <agent-uri> --private-key <0x...> [--broadcast]
  ens-agent registry identity set-uri                --chain-name <chain> <agent-id> <new-uri> --private-key <0x...> [--broadcast]
  ens-agent registry identity set-wallet             --chain-name <chain> <agent-id> <wallet> --private-key <0x...> [--deadline <ts>] [--signature <0x...>] [--broadcast]
  ens-agent registry identity unset-wallet           --chain-name <chain> <agent-id> --private-key <0x...> [--broadcast]

  ens-agent metadata template
  ens-agent metadata validate <payload.json>
  ens-agent metadata set <ens-node> <payload.json> --private-key <key> [--broadcast]

Run \`ens-agent <command> --help\` for details on a specific command.
`)
  process.exit(0)
}

const app = new Pastel({
  importMeta: import.meta,
})

await app.run()
