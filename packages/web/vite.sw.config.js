import { defineConfig } from "vite"
import replace from "@rollup/plugin-replace"

export default defineConfig(({ mode }) => ({
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      // fix sax on browser
      define: {
        global: "globalThis"
      },
      inject: ["./stream-shim.js"]
    }
  },
  resolve: {
    alias: {
      stream: "./stream-shim.js"
    }
  },
  build: {
    minify: mode !== "development",
    lib: {
      entry: "./sw/service-worker.ts",
      name: "sw",
      fileName: "service-worker",
      formats: ["iife"]
    },
    outDir: "./public",
    sourcemap: true,
    // @important
    // otherwise it will wipe /public folder
    emptyOutDir: false,
    rollupOptions: {
      output: {
        chunkFileNames: "[name].js",
        entryFileNames: "[name].js"
      }
    }
  },
  plugins: [
    // This variable is defined by webpack (and some other tooling), but not by Rollup.
    // Set it to "production" if we're in prod, which will hide all of Workbox's log messages.
    replace({
      "process.env.NODE_ENV": JSON.stringify(mode),
      preventAssignment: true
    })
  ]
}))
