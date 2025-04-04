import { defineConfig } from "vite"
import dts from "vite-plugin-dts"

export default defineConfig(({ mode }) => ({
  build: {
    lib: {
      entry: "./src/index.ts",
      name: "oboku-shared",
      fileName: `index`,
    },
    emptyOutDir: mode !== "development",
    sourcemap: true,
  },
  plugins: [
    dts({
      entryRoot: "src",
    }),
  ],
}))
