import { readFileSync } from 'node:fs';
import { Box, Text, useApp } from 'ink';
import React from 'react';
import { z } from 'zod';
import { AgentMetadataPayloadSchema } from '../../index.js';
export const args = z.tuple([z.string().describe('payload.json')]);
export default function MetadataValidate({ args: [file] }) {
    const { exit } = useApp();
    let fileError = null;
    let result = null;
    try {
        const contents = readFileSync(file, 'utf8');
        const raw = JSON.parse(contents);
        result = AgentMetadataPayloadSchema.safeParse(raw);
    }
    catch (err) {
        fileError = err.message;
    }
    React.useEffect(() => {
        if (fileError || (result && !result.success)) {
            exit(new Error('validation failed'));
        }
        else {
            exit();
        }
    }, [exit, fileError, result]);
    if (fileError) {
        return (React.createElement(Box, { flexDirection: "column" },
            React.createElement(Text, { color: "red" },
                "\u274C Error reading file: ",
                fileError)));
    }
    if (result.success) {
        const keys = Object.keys(result.data);
        return (React.createElement(Box, { flexDirection: "column" },
            React.createElement(Text, { color: "green" }, "\u2705 Valid ENS agent metadata payload"),
            React.createElement(Text, { color: "gray" },
                " ",
                keys.length,
                " text records")));
    }
    return (React.createElement(Box, { flexDirection: "column" },
        React.createElement(Text, { color: "red" }, "\u274C Invalid agent metadata payload"),
        result.error.issues.map((issue) => {
            const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
            const key = `${path}.${issue.message}`;
            return (React.createElement(Box, { key: key },
                React.createElement(Text, { color: "red" },
                    '  ',
                    "[",
                    path,
                    "] ",
                    issue.message)));
        })));
}
