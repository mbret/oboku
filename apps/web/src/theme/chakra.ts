import { defineConfig } from "@chakra-ui/react"
import { defaultConfig } from "@chakra-ui/react"
import { createSystem } from "@chakra-ui/react"

export const defaultSystem = createSystem(defaultConfig)

export const einkSystem = createSystem(
  defaultConfig,
  defineConfig({
    theme: {
      tokens: {
        durations: {
          moderate: { value: "0ms" },
        },
      },
    },
  }),
)
