import { defineConfig } from "vitest/config"
import { VitePWA } from "vite-plugin-pwa"
import react from "@vitejs/plugin-react"
import svgr from "vite-plugin-svgr"
import replace from "@rollup/plugin-replace"
import path from "node:path"
import { getAuthCallbackRollupInput } from "./src/plugins/common/authCallbackEntrypoints.shared"

const manualChunkGroups = [
  ["dropbox", ["dropbox"]],
  ["zipjs", ["@zip.js/zip.js"]],
  ["xmldoc", ["xmldoc"]],
  ["firebase", ["firebase/app", "firebase/analytics"]],
  ["prosereader", ["@prose-reader/core"]],
  ["prosereadershared", ["@prose-reader/shared"]],
  ["rxjsoperators", ["rxjs/operators"]],
  ["rxjs", ["rxjs"]],
  // used by chakra -> ark
  ["zod", ["zod"]],
  ["dexie", ["dexie"]],
  ["tanstack", ["@tanstack/query-core"]],
] as const

const getManualChunkName = (id: string) => {
  const normalizedId = id.replaceAll("\\", "/")

  for (const [chunkName, packageNames] of manualChunkGroups) {
    for (const packageName of packageNames) {
      if (normalizedId.includes(`/node_modules/${packageName}/`)) {
        return chunkName
      }
    }
  }

  return undefined
}

export default defineConfig(({ mode }) => ({
  test: {
    /**
     * Node 24+ ships an experimental global Web Storage `localStorage`. Without
     * a `--localstorage-file` path its methods are missing (accessing
     * `localStorage.getItem` throws "is not a function"), and it shadows the
     * jsdom `localStorage` that our jsdom-environment tests rely on. Disable it
     * in the test workers so jsdom provides a working implementation.
     */
    execArgv: ["--no-experimental-webstorage"],
  },
  build: {
    // Keep source maps in production for error logging (stack traces). Excluded from PWA precache via globIgnores.
    sourcemap: true,
    minify: mode !== "development",
    emptyOutDir: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        main: "index.html",
        ...getAuthCallbackRollupInput(),
      },
      output: {
        manualChunks(id) {
          return getManualChunkName(id)
        },
      },
    },
  },
  optimizeDeps: {
    /**
     * Vite 8 / rolldown has CJS interop issues where MUI's nested @mui/system
     * (.mjs) imports `prop-types` as a default export, but prop-types is CJS
     * and gets served raw via /@fs/, breaking the default export.
     *
     * See: https://github.com/vitejs/vite/issues/21850
     */
    include: ["prop-types", "react-is", "hoist-non-react-statics"],
    rolldownOptions: {
      transform: {
        // Node.js global to browser globalThis
        // fix sax on browser
        define: {
          global: "globalThis",
        },
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
    /**
     * Resolve internal @oboku/* packages to their TypeScript sources (via the
     * "source" export condition) instead of dist. Gives HMR on package edits
     * and removes the need to pre-build them for the web app. The API uses
     * NodeNext resolution and does not request this condition, so it keeps
     * resolving to the compiled dist output.
     *
     * The trailing conditions re-add Vite's defaults, which are otherwise
     * replaced when this option is set.
     */
    conditions: ["source", "module", "browser", "development|production"],
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
