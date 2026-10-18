import { defineConfig } from "@hey-api/openapi-ts"

export default defineConfig({
  input: "./dist/openapi.json",
  output: {
    path: "../../packages/shared/src/api-types/generated",
    tsConfigPath: "../../packages/shared/tsconfig.json",
  },
  plugins: ["@hey-api/typescript"],
})
