import { defineConfig } from "@chakra-ui/react"
import { defaultConfig } from "@chakra-ui/react"
import { createSystem } from "@chakra-ui/react"

export const defaultSystem = createSystem(defaultConfig)

/**
 * Every named palette's semantic tokens collapse to gray equivalents.
 * Reused below so each palette gets the same monochrome remap.
 */
const grayMirror = {
  contrast: { value: "{colors.gray.contrast}" },
  fg: { value: "{colors.gray.fg}" },
  subtle: { value: "{colors.gray.subtle}" },
  muted: { value: "{colors.gray.muted}" },
  emphasized: { value: "{colors.gray.emphasized}" },
  solid: { value: "{colors.gray.solid}" },
  focusRing: { value: "{colors.gray.focusRing}" },
  border: { value: "{colors.gray.border}" },
}

/**
 * E-ink Chakra overrides. Mirrors the MUI `eInkTheme` so consuming
 * components don't need to know about e-ink mode.
 */
export const einkSystem = createSystem(
  defaultConfig,
  defineConfig({
    globalCss: {
      ":root": {
        colorScheme: "light",
      },
      "*, *::before, *::after": {
        animationDuration: "0.01ms !important",
        animationIterationCount: "1 !important",
        transitionDuration: "0.01ms !important",
        scrollBehavior: "auto !important",
      },
      "button:disabled, [aria-disabled='true']": {
        opacity: "0.25 !important",
      },
    },
    theme: {
      tokens: {
        durations: {
          moderate: { value: "0.01ms" },
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
        colors: {
          red: grayMirror,
          orange: grayMirror,
          yellow: grayMirror,
          green: grayMirror,
          teal: grayMirror,
          blue: grayMirror,
          cyan: grayMirror,
          purple: grayMirror,
          pink: grayMirror,
          bg: {
            error: { value: "{colors.gray.subtle}" },
            warning: { value: "{colors.gray.subtle}" },
            success: { value: "{colors.gray.subtle}" },
            info: { value: "{colors.gray.subtle}" },
          },
          fg: {
            error: { value: "{colors.gray.fg}" },
            warning: { value: "{colors.gray.fg}" },
            success: { value: "{colors.gray.fg}" },
            info: { value: "{colors.gray.fg}" },
          },
          border: {
            error: { value: "{colors.gray.border}" },
            warning: { value: "{colors.gray.border}" },
            success: { value: "{colors.gray.border}" },
            info: { value: "{colors.gray.border}" },
          },
        },
      },
    },
  }),
)
