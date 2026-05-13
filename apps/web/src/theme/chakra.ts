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
 * - Global reduced-motion + auto scroll + light color-scheme: replicates
 *   what the OS would emit under `prefers-reduced-motion: reduce` and
 *   `prefers-color-scheme: light` so third-party libs and raw CSS that
 *   already honor those queries adapt without per-library overrides.
 *   Browsers don't let JS force the media queries, so we mimic the
 *   effect. `0.01ms` (not `0`) is used so libraries that listen for
 *   `transitionend` still fire.
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
      },
    },
  }),
)
