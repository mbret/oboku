import { defineConfig } from "@hey-api/openapi-ts"

export default defineConfig({
  input: "openapi.json",
  output: {
    path: "../../packages/shared/src/api-types/generated",
    tsConfigPath: "../../packages/shared/tsconfig.json",
  },
  plugins: ["@hey-api/typescript"],
})
