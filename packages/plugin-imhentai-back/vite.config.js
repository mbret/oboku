import { defineConfig } from "vite"
import dts from "vite-plugin-dts"
import { resolve } from "path"
import { name } from "./package.json"
import { externals } from "rollup-plugin-node-externals"

const libName = name.replace("@", "").replace("/", "-")

export default defineConfig(({ mode }) => ({
  build: {
    minify: false,
    lib: {
      entry: resolve(__dirname, `src/index.ts`),
      name: libName,
      fileName: libName
      // formats: ["cjs"]
    },
    emptyOutDir: mode !== "development",
    sourcemap: true
  },
  plugins: [
    {
      enforce: "pre",
      ...externals({
        peerDeps: true,
        deps: true,
        devDeps: true
      })
    },
    dts()
  ]
}))
