import { readFileSync } from 'node:fs';
import { Box, Text, useApp } from 'ink';
import React from 'react';
import { z } from 'zod';
import { validateRegistrationFile } from '../index.js';
export const args = z.tuple([z.string().describe('file')]);
export default function Validate({ args: [file] }) {
    const { exit } = useApp();
    let fileError = null;
    let result = null;
    try {
        const contents = readFileSync(file, 'utf8');
        const raw = JSON.parse(contents);
        result = validateRegistrationFile(raw);
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
        return (React.createElement(Box, null,
            React.createElement(Text, { color: "green" }, "\u2705 Valid AgentRegistrationFile")));
    }
    return (React.createElement(Box, { flexDirection: "column" },
        React.createElement(Text, { color: "red" }, "\u274C Invalid AgentRegistrationFile"),
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
