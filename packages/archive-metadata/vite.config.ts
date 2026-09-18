import { definePackageLibConfig } from "../../config/vite.lib.ts"

export default definePackageLibConfig("oboku-archive-metadata", {
  web: "./src/web.ts",
  node: "./src/node.ts",
})
