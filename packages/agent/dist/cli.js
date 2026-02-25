#!/usr/bin/env node
/**
 * CLI entry point for @ens-node-metadata/agent.
 * Powered by Pastel + Ink.
 *
 * Commands:
 *   agent skill [--install]
 *   agent registration-file template
 *   agent registration-file validate <file.json>
 *   agent registration-file publish <file.json>
 *   agent registry identity --chain-name <chain> <agent-uri>
 *   agent metadata template
 *   agent metadata validate <payload.json>
 *   agent register <ENS> <payload.json> --private-key <key> [--broadcast]
 *   agent update <ENS> <payload.json> --private-key <key> [--broadcast]
 */
import Pastel from 'pastel';
const app = new Pastel({
    importMeta: import.meta,
});
await app.run();
