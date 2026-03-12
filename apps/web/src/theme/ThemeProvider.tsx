import {
  CssBaseline,
  ThemeProvider as MuiThemeProvider,
  useColorScheme,
} from "@mui/material"
import { eInkTheme, theme } from "./theme"
import { type ReactNode, memo, useEffect } from "react"
import { useLocalSettings } from "../settings/useLocalSettings"
import { ChakraProvider } from "@chakra-ui/react"
import { ThemeProvider as NextThemes } from "next-themes"
import { defaultSystem, einkSystem } from "./chakra"

const ColorModeSwitcher = () => {
  const { mode, setMode } = useColorScheme()
  const { themeMode = "system" } = useLocalSettings()
  const nextMode = themeMode === "e-ink" ? "light" : themeMode

  useEffect(() => {
    if (mode !== nextMode) {
      setMode(nextMode)
    }
  }, [mode, nextMode, setMode])

  return null
}

const ChakraThemeProvider = memo(({ children }: { children: ReactNode }) => {
  const { themeMode = "system" } = useLocalSettings()
  const isSystemTheme = themeMode === "system"
  const forcedTheme =
    themeMode === "e-ink" ? "light" : isSystemTheme ? undefined : themeMode

  /* Chakra seems to be very well scoped so it's okay to wrap it on app level even if it's used 
      only by the reader. We may as well use chakra components here and there when needed */
  return (
    <ChakraProvider value={themeMode === "e-ink" ? einkSystem : defaultSystem}>
      <NextThemes
        attribute="class"
        disableTransitionOnChange
        enableSystem={isSystemTheme}
        {...(forcedTheme && { forcedTheme })}
      >
        {children}
      </NextThemes>
    </ChakraProvider>
  )
})

export const ThemeProvider = memo(({ children }: { children: ReactNode }) => {
  const { themeMode = "system" } = useLocalSettings()
  const muiMode =
    themeMode === "system"
      ? "system"
      : themeMode === "e-ink"
        ? "light"
        : themeMode

  return (
    <MuiThemeProvider
      theme={themeMode === "e-ink" ? eInkTheme : theme}
      noSsr
      defaultMode={muiMode}
      storageManager={null}
    >
      <CssBaseline />
      <ColorModeSwitcher />
      <ChakraThemeProvider>{children}</ChakraThemeProvider>
    </MuiThemeProvider>
  )
})
