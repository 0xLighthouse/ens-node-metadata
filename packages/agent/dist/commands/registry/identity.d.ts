import React from 'react';
import { z } from 'zod';
export declare const options: z.ZodObject<{
    chainName: z.ZodDefault<z.ZodEnum<["base", "mainnet"]>>;
}, "strip", z.ZodTypeAny, {
    chainName: "base" | "mainnet";
}, {
    chainName?: "base" | "mainnet" | undefined;
}>;
export declare const args: z.ZodTuple<[z.ZodString], null>;
type Props = {
    options: z.infer<typeof options>;
    args: z.infer<typeof args>;
};
export default function RegistryIdentity({ options: { chainName }, args: [agentUri] }: Props): React.JSX.Element;
export {};
//# sourceMappingURL=identity.d.ts.map