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

/**
 * - Automatically update the color mode when user changes preferences.
 * - Automatically restore the user color mode once he log in.
 */
const ColorModeSwitcher = () => {
  const { setMode } = useColorScheme()
  const { themeMode = "system" } = useLocalSettings()

  useEffect(() => {
    setMode(themeMode === "e-ink" ? "system" : themeMode)
  }, [setMode, themeMode])

  return null
}

const ChakraThemeProvider = memo(({ children }: { children: ReactNode }) => {
  const { themeMode } = useLocalSettings()
  const { colorScheme } = useColorScheme()

  /* Chakra seems to be very well scoped so it's okay to wrap it on app level even if it's used 
      only by the reader. We may as well use chakra components here and there when needed */
  return (
    <ChakraProvider value={themeMode === "e-ink" ? einkSystem : defaultSystem}>
      <NextThemes
        attribute="class"
        disableTransitionOnChange
        // {...(prefersDarkColorScheme() && { forcedTheme: "dark" })}
        // for now we use light mode on oboku so we need to force it
        // as well here otherwise it would create inconsistency
        {...(colorScheme === "dark" && { forcedTheme: "dark" })}
        {...((colorScheme === "light" || themeMode === "e-ink") && {
          forcedTheme: "light",
          // otherwise system
        })}
      >
        {children}
      </NextThemes>
    </ChakraProvider>
  )
})

export const ThemeProvider = memo(({ children }: { children: ReactNode }) => {
  const { themeMode } = useLocalSettings()

  return (
    <MuiThemeProvider
      theme={themeMode === "e-ink" ? eInkTheme : theme}
      /**
       * This will use the last saved mode or fallback to system.
       */
      defaultMode="system"
    >
      <CssBaseline />
      <ColorModeSwitcher />
      <ChakraThemeProvider>{children}</ChakraThemeProvider>
    </MuiThemeProvider>
  )
})
