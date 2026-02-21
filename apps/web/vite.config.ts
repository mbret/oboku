import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"
import react from "@vitejs/plugin-react"
import svgr from "vite-plugin-svgr"
import replace from "@rollup/plugin-replace"
import path from "node:path"

export default defineConfig(({ mode }) => ({
  build: {
    // Keep source maps in production for error logging (stack traces). Excluded from PWA precache via globIgnores.
    sourcemap: true,
    minify: mode !== "development",
    emptyOutDir: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        main: "index.html",
      },
      output: {
        manualChunks: {
          jszip: ["jszip"],
          dropbox: ["dropbox"],
          xmldoc: ["xmldoc"],
          firebase: ["firebase/app", "firebase/analytics"],
          prosereader: ["@prose-reader/core"],
          prosereadershared: ["@prose-reader/shared"],
          rxjs: ["rxjs"],
          rxjsoperators: ["rxjs/operators"],
          datefns: ["date-fns"],
          // used by chakra -> ark
          zod: ["zod"],
          dexie: ["dexie"],
          tanstack: ["@tanstack/query-core"],
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
          // Exclude source maps from precache (not needed offline; main bundle map is ~21 MB)
          "**/*.js.map",
          "**/*.css.map",
        ],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MiB; large assets (e.g. maps) excluded via globIgnores
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
