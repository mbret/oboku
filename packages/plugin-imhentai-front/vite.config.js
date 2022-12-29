import { defineConfig } from "vite"
import dts from "vite-plugin-dts"
import { resolve } from "path"
import { name } from "./package.json"
import react from "@vitejs/plugin-react"
import { externals } from "rollup-plugin-node-externals"

const libName = name.replace("@", "").replace("/", "-")

export default defineConfig(({ mode }) => ({
  build: {
    minify: false,
    lib: {
      entry: resolve(__dirname, `src/index.tsx`),
      name: libName,
      fileName: libName
    },
    emptyOutDir: mode !== "development",
    sourcemap: true,
    rollupOptions: {
      // external: [`@oboku/plugin-imhentai-shared`, `@oboku/plugin-front`],
      // output: {
      //   globals: {
      //     "@oboku/plugin-imhentai-shared": `@oboku/plugin-imhentai-shared`,
      //     "@oboku/plugin-front": `@oboku/plugin-front`
      //   }
      // }
    }
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
    react(),
    dts()
  ]
}))
