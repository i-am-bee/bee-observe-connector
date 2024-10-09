import { defineConfig } from 'tsup';
import packageJson from './package.json';

export default defineConfig({
  target: 'es2022',
  tsconfig: './tsconfig.json',
  format: ['cjs', 'esm'],
  splitting: false,
  clean: true,
  dts: true,
  define: {
    __LIBRARY_VERSION: JSON.stringify(packageJson.version)
  },
  entry: ['src/**/*.ts', '!src/**/*.test.ts']
});
