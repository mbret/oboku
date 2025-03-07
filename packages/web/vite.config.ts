import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"
import react from "@vitejs/plugin-react"
import svgr from "vite-plugin-svgr"
import replace from "@rollup/plugin-replace"
import path from "node:path"

export default defineConfig(({ mode }) => ({
  build: {
    /**
     * @todo they takes enormous amount of mb.
     * Migrate to sending it to sentry directly.
     */
    sourcemap: true,
    minify: mode !== "development",
    emptyOutDir: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        main: "index.html",
      },
      output: {
        manualChunks: (id) => {
          if (id.includes("firebase")) {
            console.log("firebase", id)
          }

          if (
            id.includes("/node_modules/firebase") ||
            id.includes("/node_modules/@firebase") ||
            id.includes("/node_modules/dropbox") ||
            id.includes("/node_modules/jszip") ||
            id.includes("/node_modules/xmldoc") ||
            id.includes("/node_modules/dexie") ||
            id.includes("/node_modules/rxdb") ||
            id.includes("/node_modules/rxjs") ||
            id.includes("/node_modules/date-fns") ||
            id.includes("/node_modules/react")
          ) {
            return "vendors1"
          }

          // Create a 'vendor' chunk for node_modules
          if (id.includes("node_modules")) {
            return "vendors2"
          }

          // Everything else goes to 'index'
          return "index"
        },
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      // fix sax on browser
      define: {
        global: "globalThis",
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  /**
   * require('events') uses package events which is a web polyfill
   */
  resolve: {
    alias: {
      stream: path.resolve(__dirname, "./stream-shim.js"),
    },
  },
  plugins: [
    VitePWA({
      base: "/",
      minify: false,
      injectRegister: false,
      strategies: "injectManifest",
      injectManifest: {
        rollupFormat: "iife",
        // globPatterns: ["**\/*.{js,css,html,js.mem,ico,json}"],
        // we need to pre-cache the entire assets as the app is fully offline
        globPatterns: ["**/*"],
        globIgnores: [
          "**/node_modules/**/*",
          // sourcemap will be uploaded on reporting service directly
          "**/*.{js.map}",
        ],
        // sources map are really massive, they will be optimized when served by server
        maximumFileSizeToCacheInBytes: 13e6, // 13 MB limit
      },
      srcDir: "src",
      filename: "service-worker.ts",
      ...(mode === "development" && {
        devOptions: {
          enabled: true,
        },
      }),
    }),
    react({}),
    svgr({}),
    replace({
      // fix for util/util.js
      "process.env.NODE_DEBUG": false,
      preventAssignment: true,
    }),
  ],
}))
