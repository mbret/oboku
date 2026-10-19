import { defineConfig } from "vite"
import viteReact from "@vitejs/plugin-react"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import { resolve } from "node:path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    viteReact(),
  ],
  test: {
    globals: true,
    environment: "jsdom",
  },
  resolve: {
    /**
     * Resolves @oboku/shared to its TypeScript sources through its "source"
     * export condition, like the web app, so the tests and the dev server do
     * not need it built first. The trailing conditions re-add Vite's defaults,
     * which are otherwise replaced when this option is set.
     */
    conditions: ["source", "module", "browser", "development|production"],
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
})
