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
export default function Register({ args: [ensName, payloadFile], options }: Props): React.JSX.Element;
export {};
//# sourceMappingURL=register.d.ts.map