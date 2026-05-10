import {
  CssBaseline,
  ThemeProvider as MuiThemeProvider,
  type ThemeProviderProps,
  useColorScheme,
  useMediaQuery,
} from "@mui/material"
import { eInkTheme, theme } from "./theme"
import { type ReactNode, memo, useEffect } from "react"
import { useLocalSettings } from "../settings/useLocalSettings"
import { ChakraProvider } from "@chakra-ui/react"
import { ThemeProvider as NextThemes } from "next-themes"
import { defaultSystem, einkSystem } from "./chakra"

type AppThemeMode = NonNullable<ThemeProviderProps["defaultMode"]> | "e-ink"
type ResolvedChakraThemeMode = "light" | "dark"

const getResolvedChakraThemeMode = ({
  prefersDarkMode,
  systemMode,
  themeMode,
}: {
  prefersDarkMode: boolean
  systemMode?: ResolvedChakraThemeMode
  themeMode: AppThemeMode
}): ResolvedChakraThemeMode => {
  if (themeMode === "light" || themeMode === "dark") {
    return themeMode
  }

  if (themeMode === "system") {
    return systemMode ?? (prefersDarkMode ? "dark" : "light")
  }

  return "light"
}

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

const ChakraThemeProvider = memo(function ChakraThemeProvider({
  children,
}: {
  children: ReactNode
}) {
  const { themeMode = "system" } = useLocalSettings()
  const { systemMode } = useColorScheme()
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)", {
    noSsr: true,
  })
  const forcedTheme = getResolvedChakraThemeMode({
    prefersDarkMode,
    systemMode,
    themeMode,
  })

  /* Chakra seems to be very well scoped so it's okay to wrap it on app level even if it's used 
      only by the reader. We may as well use chakra components here and there when needed */
  return (
    <ChakraProvider value={themeMode === "e-ink" ? einkSystem : defaultSystem}>
      <NextThemes
        attribute="class"
        disableTransitionOnChange
        enableSystem={false}
        forcedTheme={forcedTheme}
      >
        {children}
      </NextThemes>
    </ChakraProvider>
  )
})

export const ThemeProvider = memo(function ThemeProvider({
  children,
}: {
  children: ReactNode
}) {
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
