import React from 'react';
import { z } from 'zod';
export declare const args: z.ZodTuple<[z.ZodString], null>;
type Props = {
    args: z.infer<typeof args>;
};
export default function RegistrationFilePublish({ args: [file] }: Props): React.JSX.Element;
export {};
//# sourceMappingURL=publish.d.ts.map