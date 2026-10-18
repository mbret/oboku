import { defineConfig } from "@hey-api/openapi-ts"

export default defineConfig({
  input: "./dist/openapi.json",
  output: {
    path: "../../packages/shared/src/api-types/generated",
    tsConfigPath: "../../packages/shared/tsconfig.json",
    // hey-api 0.99 renders the client runtime it copies into `client/` and
    // `core/` without a `file`. That code does not compile under the shared
    // package's `exactOptionalPropertyTypes`, so it skips type checking like
    // a dependency's code.
    header: function skipTypeCheckingOfBundledClient(context) {
      const isBundledClientFile = !context.file

      return isBundledClientFile
        ? [...context.defaultValue, "// @ts-nocheck"]
        : context.defaultValue
    },
  },
  plugins: [
    "@hey-api/typescript",
    { name: "@hey-api/client-fetch", throwOnError: true },
    { name: "@hey-api/sdk", client: false },
    { name: "zod", includeInEntry: true },
  ],
})
