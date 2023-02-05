import type { Config } from "@jest/types"

const config: Config.InitialOptions = {
  preset: "ts-jest",
  verbose: false,
  testEnvironment: "node",
  testPathIgnorePatterns: ["/node_modules/", "__api"]
}

export default config
