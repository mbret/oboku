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
        shadows: {
          xs: { value: "none" },
          sm: { value: "none" },
          md: { value: "none" },
          lg: { value: "none" },
          xl: { value: "none" },
          "2xl": { value: "none" },
          inset: { value: "none" },
        },
      },
    },
  }),
)
