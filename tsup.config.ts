import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['./src/index.ts'],
  format: ['cjs', 'esm'],
  splitting: true,
  cjsInterop: true,
  clean: true,
  dts: true,
  platform: 'node'
})
