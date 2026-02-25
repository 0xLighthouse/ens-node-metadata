import React from 'react';
import { z } from 'zod';
export declare const args: z.ZodTuple<[z.ZodString], null>;
type Props = {
    args: z.infer<typeof args>;
};
export default function RegistrationFileValidate({ args: [file] }: Props): React.JSX.Element;
export {};
//# sourceMappingURL=validate.d.ts.map