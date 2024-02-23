import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"
import react from "@vitejs/plugin-react"
import svgr from "vite-plugin-svgr"
import replace from "@rollup/plugin-replace"
import path from "path"

export default defineConfig(({ mode }) => ({
  build: {
    sourcemap: true,
    minify: mode !== "development",
    emptyOutDir: true
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      // fix sax on browser
      define: {
        global: "globalThis"
      }
    }
  },
  server: {
    proxy: {
      // with options: http://localhost:5173/api/bar-> http://jsonplaceholder.typicode.com/bar
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "")
      }
    }
  },
  /**
   * require('events') uses package events which is a web polyfill
   */
  resolve: {
    alias: {
      stream: path.resolve(__dirname, "./stream-shim.js")
    }
  },
  plugins: [
    VitePWA({
      base: "/",
      minify: false,
      injectRegister: null,
      strategies: "injectManifest",
      injectManifest: {
        rollupFormat: "iife",
        // globPatterns: ["**\/*.{js,css,html,js.mem,ico,json}"],
        // we need to pre-cache the entire assets as the app is fully offline
        globPatterns: ["**/*"],
        globIgnores: [
          "**/node_modules/**/*",
          // sourcemap will be uploaded on reporting service directly
          "**/*.{js.map}"
        ],
        maximumFileSizeToCacheInBytes: 5e6
      },
      srcDir: "src",
      filename: "service-worker.ts",
      ...(mode === "development" && {
        devOptions: {
          enabled: true
        }
      })
    }),
    react({}),
    svgr({}),
    replace({
      // fix for util/util.js
      "process.env.NODE_DEBUG": false,
      preventAssignment: true
    })
  ]
}))
