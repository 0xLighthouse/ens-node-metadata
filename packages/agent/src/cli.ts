#!/usr/bin/env node
import Pastel from 'pastel'

const args = process.argv.slice(2)
const isRootHelp =
  args.length === 0 || (args.length === 1 && (args[0] === '--help' || args[0] === '-h'))

if (isRootHelp) {
  console.log(`
CLI for registering AI agents on ENS using ERC-8004 (v2.0).

Usage:
  agent skill [--install]

  agent registration-file template
  agent registration-file validate <file.json>
  agent registration-file publish <file.json>

  agent registry identity --chain-name <chain> <agent-uri>

  agent metadata template
  agent metadata validate <payload.json>
  agent metadata set <ens-node> <payload.json> --private-key <key> [--broadcast]

Run \`agent <command> --help\` for details on a specific command.
`)
  process.exit(0)
}

const app = new Pastel({
  importMeta: import.meta,
})

await app.run()
