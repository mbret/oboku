import { defineConfig } from "@chakra-ui/react"
import { defaultConfig } from "@chakra-ui/react"
import { createSystem } from "@chakra-ui/react"

export const defaultSystem = createSystem(defaultConfig)

/**
 * E-ink Chakra overrides. Mirrors the MUI `eInkTheme` so consuming
 * components don't need to know about e-ink mode.
 *
 * - `durations.moderate` → `0ms`: e-ink can't render smooth animations.
 * - `shadows.*` → 1px black outline: e-ink renders drop shadows poorly;
 *   we keep `shadow="md"`'s semantic role (separating elevated panels
 *   from content) but express it as a hard border. Uses `box-shadow`
 *   instead of `border` to avoid reflow and to follow `border-radius`.
 * - Disabled opacity dropped to `0.25`: Chakra's default (~0.4) quantizes
 *   to a shade nearly identical to enabled on 16-grayscale e-ink panels.
 */
export const einkSystem = createSystem(
  defaultConfig,
  defineConfig({
    globalCss: {
      "button:disabled, [aria-disabled='true']": {
        opacity: "0.25 !important",
      },
    },
    theme: {
      tokens: {
        durations: {
          moderate: { value: "0ms" },
        },
      },
      semanticTokens: {
        shadows: {
          xs: { value: "0 0 0 1px #000" },
          sm: { value: "0 0 0 1px #000" },
          md: { value: "0 0 0 1px #000" },
          lg: { value: "0 0 0 1px #000" },
          xl: { value: "0 0 0 1px #000" },
          "2xl": { value: "0 0 0 1px #000" },
          inner: { value: "none" },
          inset: { value: "none" },
        },
      },
    },
  }),
)
