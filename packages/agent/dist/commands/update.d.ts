import React from 'react';
import { z } from 'zod';
export declare const args: z.ZodTuple<[z.ZodString, z.ZodString], null>;
export declare const options: z.ZodObject<{
    privateKey: z.ZodString;
    broadcast: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    privateKey: string;
    broadcast: boolean;
}, {
    privateKey: string;
    broadcast?: boolean | undefined;
}>;
type Props = {
    args: z.infer<typeof args>;
    options: z.infer<typeof options>;
};
/**
 * `agent update` — identical to `agent register` but semantically intended for
 * updating an already-registered agent's ENS text records.
 *
 * Uses viem + ensjs `setRecords` under the hood. Both commands call the same
 * on-chain function; the distinction is conceptual (initial set vs. update).
 */
export default function Update({ args: [ensName, payloadFile], options }: Props): React.JSX.Element;
export {};
//# sourceMappingURL=update.d.ts.map