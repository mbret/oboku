import { defineConfig } from "vite"
import dts from "unplugin-dts/vite"

export default defineConfig(({ mode }) => ({
  build: {
    lib: {
      entry: "./src/index.ts",
      name: "oboku-shared",
      fileName: `index`,
      formats: ["es", "cjs"],
    },
    emptyOutDir: mode !== "development",
    sourcemap: true,
  },
  plugins: [dts({ bundleTypes: true })],
}))
