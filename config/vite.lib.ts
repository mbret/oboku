import { defineConfig, type UserConfigFnObject } from "vite"
import dts from "unplugin-dts/vite"

/**
 * Shared Vite config factory for internal `packages/*` libraries.
 *
 * All current libraries publish a single `./src/index.ts` entry as ESM + CJS,
 * emit bundled `.d.ts` types, and only differ by the UMD-style `name`.
 * Adding a new internal package should be a one-line `vite.config.ts`.
 */
export const definePackageLibConfig = (name: string): UserConfigFnObject =>
  defineConfig(({ mode }) => ({
    build: {
      lib: {
        entry: "./src/index.ts",
        name,
        fileName: "index",
        formats: ["es", "cjs"],
      },
      emptyOutDir: mode !== "development",
      sourcemap: true,
    },
    plugins: [dts({ bundleTypes: true })],
  }))
