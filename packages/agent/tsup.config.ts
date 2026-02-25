import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    cli: 'src/cli.ts',
    index: 'src/index.ts',
  },
  format: ['esm'],
  target: 'node18',
  dts: true,
  clean: true,
  noExternal: ['@ens-node-metadata/shared', '@ens-node-metadata/schemas'],
})
