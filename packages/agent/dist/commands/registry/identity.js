import { Box, Text, useApp } from 'ink';
import React from 'react';
import { http, createPublicClient } from 'viem';
import { base, mainnet } from 'viem/chains';
import { z } from 'zod';
export const options = z.object({
    chainName: z
        .enum(['base', 'mainnet'])
        .default('mainnet')
        .describe('Chain to query (base | mainnet)'),
});
export const args = z.tuple([z.string().describe('agent-uri')]);
/**
 * Known ERC-8004 Identity Registry contract addresses.
 * Override via ERC8004_REGISTRY_BASE / ERC8004_REGISTRY_MAINNET env vars.
 */
const REGISTRY_ADDRESSES = {
    mainnet: (process.env.ERC8004_REGISTRY_MAINNET ??
        '0x0000000000000000000000000000000000000000'),
    base: (process.env.ERC8004_REGISTRY_BASE ??
        '0x0000000000000000000000000000000000000000'),
};
const ERC8004_REGISTRY_ABI = [
    {
        name: 'agentOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'agentUri', type: 'string' }],
        outputs: [
            { name: 'owner', type: 'address' },
            { name: 'tokenId', type: 'uint256' },
            { name: 'agentUri', type: 'string' },
        ],
    },
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'owner', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
];
export default function RegistryIdentity({ options: { chainName }, args: [agentUri] }) {
    const { exit } = useApp();
    const [state, setState] = React.useState({ status: 'loading' });
    React.useEffect(() => {
        async function run() {
            const chain = chainName === 'base' ? base : mainnet;
            const registryAddress = REGISTRY_ADDRESSES[chainName];
            if (registryAddress === '0x0000000000000000000000000000000000000000') {
                setState({
                    status: 'error',
                    message: `No registry address configured for ${chainName}.\n` +
                        `Set ERC8004_REGISTRY_${chainName.toUpperCase()} env var to the contract address.`,
                });
                exit(new Error('no registry address'));
                return;
            }
            try {
                const client = createPublicClient({
                    chain,
                    transport: http(),
                });
                const result = await client.readContract({
                    address: registryAddress,
                    abi: ERC8004_REGISTRY_ABI,
                    functionName: 'agentOf',
                    args: [agentUri],
                });
                setState({
                    status: 'done',
                    identity: {
                        owner: result[0],
                        tokenId: result[1],
                        agentUri: result[2],
                        chain: chainName,
                        registryAddress,
                    },
                });
                exit();
            }
            catch (err) {
                setState({
                    status: 'error',
                    message: `Registry read failed: ${err.message}`,
                });
                exit(new Error('registry read failed'));
            }
        }
        run();
    }, [exit, chainName, agentUri]);
    return (React.createElement(Box, { flexDirection: "column" },
        state.status === 'loading' && React.createElement(Text, { color: "cyan" }, "Querying ERC-8004 registry\u2026"),
        state.status === 'done' && (React.createElement(Box, { flexDirection: "column" },
            React.createElement(Text, { color: "green" },
                "\u2705 Agent Identity (",
                state.identity.chain,
                ")"),
            React.createElement(Text, null,
                " Agent URI: ",
                state.identity.agentUri),
            React.createElement(Text, null,
                " Owner: ",
                state.identity.owner),
            React.createElement(Text, null,
                " Token ID: ",
                state.identity.tokenId.toString()),
            React.createElement(Text, null,
                " Registry: ",
                state.identity.registryAddress))),
        state.status === 'error' && React.createElement(Text, { color: "red" },
            "\u274C ",
            state.message)));
}
