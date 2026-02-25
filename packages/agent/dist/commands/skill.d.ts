import React from 'react';
import { z } from 'zod';
export declare const options: z.ZodObject<{
    install: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    install: boolean;
}, {
    install?: boolean | undefined;
}>;
type Props = {
    options: z.infer<typeof options>;
};
export default function Skill({ options: { install } }: Props): React.JSX.Element;
export {};
//# sourceMappingURL=skill.d.ts.map