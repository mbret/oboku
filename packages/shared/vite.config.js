import { defineConfig } from "vite"
import dts from "vite-plugin-dts"
import { resolve } from "path"

export default defineConfig(({ mode }) => ({
  build: {
    minify: false,
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, `src/index.ts`),
      name: `oboku-shared`,
      fileName: `oboku-shared`
    },
    emptyOutDir: mode !== "development",
    sourcemap: true,
    /**
     * We are letting cryptojs being bundled here because it bugs when
     * letting consumer package include it
     */
    rollupOptions: {
      external: [`yup`],
      output: {
        globals: {
          yup: `yup`
        }
      }
    }
  },
  plugins: [dts()]
}))
