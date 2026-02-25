import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Text, useApp } from 'ink';
import React from 'react';
import { z } from 'zod';
export const options = z.object({
    install: z.boolean().default(false).describe('Copy SKILL.md to the current working directory'),
});
const __dirname = dirname(fileURLToPath(import.meta.url));
function getSkillMdPath() {
    // When built: dist/commands/skill.js → root is ../../
    const candidates = [
        join(__dirname, '../../SKILL.md'),
        join(__dirname, '../SKILL.md'),
        join(__dirname, 'SKILL.md'),
    ];
    for (const p of candidates) {
        if (existsSync(p))
            return p;
    }
    throw new Error('SKILL.md not found in package');
}
export default function Skill({ options: { install } }) {
    const { exit } = useApp();
    const [output, setOutput] = React.useState('');
    const [error, setError] = React.useState(null);
    React.useEffect(() => {
        try {
            const skillPath = getSkillMdPath();
            const content = readFileSync(skillPath, 'utf8');
            if (install) {
                const dest = resolve(process.cwd(), 'SKILL.md');
                copyFileSync(skillPath, dest);
                setOutput(`✅ SKILL.md copied to ${dest}`);
            }
            else {
                setOutput(content);
            }
        }
        catch (err) {
            setError(err.message);
        }
        exit();
    }, [exit, install]);
    if (error) {
        return React.createElement(Text, { color: "red" },
            "\u274C ",
            error);
    }
    return React.createElement(Text, null, output);
}
