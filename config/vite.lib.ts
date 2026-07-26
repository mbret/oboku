import { defineConfig, type UserConfigFnObject } from "vite"
import dts from "unplugin-dts/vite"
import externals from "rollup-plugin-node-externals"

/**
 * Shared Vite config factory for internal `packages/*` libraries.
 *
 * Libraries publish their entries as ESM + CJS and emit bundled `.d.ts` types.
 * Most expose a single `./src/index.ts`; pass `entries` to publish one bundle
 * per runtime instead, keyed by the name each is imported under.
 * Adding a new internal package should be a one-line `vite.config.ts`.
 */
export const definePackageLibConfig = (
  name: string,
  entries: Record<string, string> = { index: "./src/index.ts" },
): UserConfigFnObject =>
  defineConfig(({ mode }) => ({
    build: {
      lib: {
        entry: entries,
        name,
        fileName: (format, entryName) =>
          `${entryName}.${format === "es" ? "js" : "cjs"}`,
        formats: ["es", "cjs"],
      },
      emptyOutDir: mode !== "development",
      sourcemap: true,
    },
    plugins: [
      externals({ peerDeps: true, deps: true, devDeps: true }),
      dts({ bundleTypes: true }),
    ],
  }))
