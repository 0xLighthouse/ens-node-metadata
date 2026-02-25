import { readFileSync } from 'node:fs';
import { Box, Text, useApp } from 'ink';
import React from 'react';
import { z } from 'zod';
import { validateRegistrationFile } from '../../index.js';
export const args = z.tuple([z.string().describe('registration-file.json')]);
export default function RegistrationFilePublish({ args: [file] }) {
    const { exit } = useApp();
    const [state, setState] = React.useState({ status: 'idle' });
    React.useEffect(() => {
        async function run() {
            // 1. Check env vars
            const principal = process.env.W3_PRINCIPAL;
            const proof = process.env.W3_PROOF;
            if (!principal || !proof) {
                setState({
                    status: 'error',
                    message: 'Missing required env vars: W3_PRINCIPAL and W3_PROOF must be set.\n' +
                        'See README for how to obtain them from web3.storage.',
                });
                exit(new Error('missing env vars'));
                return;
            }
            // 2. Validate registration file
            setState({ status: 'validating' });
            let raw;
            try {
                raw = JSON.parse(readFileSync(file, 'utf8'));
            }
            catch (err) {
                setState({ status: 'error', message: `Error reading file: ${err.message}` });
                exit(new Error('read error'));
                return;
            }
            const result = validateRegistrationFile(raw);
            if (!result.success) {
                const issues = result.error.issues
                    .map((i) => `[${i.path.join('.') || 'root'}] ${i.message}`)
                    .join('\n');
                setState({ status: 'error', message: `Invalid registration file:\n${issues}` });
                exit(new Error('validation failed'));
                return;
            }
            // 3. Upload to IPFS via w3up-client
            setState({ status: 'uploading' });
            try {
                // Dynamic import to allow tree-shaking and avoid startup cost
                const { create } = await import('@web3-storage/w3up-client');
                const { StoreMemory } = await import('@web3-storage/w3up-client/stores/memory');
                const { parse: parseProof } = await import('@web3-storage/w3up-client/proof');
                const { parse: parseSigner } = await import('@web3-storage/w3up-client/principal/ed25519');
                const signer = parseSigner(principal);
                const store = new StoreMemory();
                const client = await create({ principal: signer, store });
                const parsedProof = await parseProof(proof);
                const space = await client.addSpace(parsedProof);
                await client.setCurrentSpace(space.did());
                const blob = new Blob([JSON.stringify(result.data, null, 2)], {
                    type: 'application/json',
                });
                const cid = await client.uploadFile(blob);
                setState({ status: 'done', uri: `ipfs://${cid.toString()}` });
                exit();
            }
            catch (err) {
                setState({ status: 'error', message: `Upload failed: ${err.message}` });
                exit(new Error('upload failed'));
            }
        }
        run();
    }, [exit, file]);
    return (React.createElement(Box, { flexDirection: "column" },
        state.status === 'idle' && React.createElement(Text, { color: "gray" }, "Preparing\u2026"),
        state.status === 'validating' && React.createElement(Text, { color: "cyan" }, "Validating registration file\u2026"),
        state.status === 'uploading' && (React.createElement(Text, { color: "cyan" }, "Uploading to IPFS via web3.storage\u2026")),
        state.status === 'done' && (React.createElement(Box, { flexDirection: "column" },
            React.createElement(Text, { color: "green" }, "\u2705 Published to IPFS"),
            React.createElement(Text, null, state.uri))),
        state.status === 'error' && (React.createElement(Box, { flexDirection: "column" },
            React.createElement(Text, { color: "red" },
                "\u274C ",
                state.message)))));
}
