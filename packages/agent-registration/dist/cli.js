#!/usr/bin/env node
/**
 * CLI entry point for @ens-node-metadata/agent-registration.
 * Powered by Pastel + Ink.
 *
 * Usage:
 *   agent-registration validate <file.json>   — validate a registration JSON file
 *   agent-registration build                  — print a starter registration JSON template
 */
import Pastel from 'pastel';
const app = new Pastel({
    importMeta: import.meta,
});
await app.run();
