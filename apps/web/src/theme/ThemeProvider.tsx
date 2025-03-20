import { CssBaseline, ThemeProvider as MuiThemeProvider } from "@mui/material"
import { eInkTheme, theme } from "./theme"
import { type ReactNode, memo } from "react"
import { useLocalSettings } from "../settings/states"
import { ChakraProvider } from "@chakra-ui/react"
import { ThemeProvider as NextThemes } from "next-themes"
import { defaultSystem, einkSystem } from "./chakra"

export const ThemeProvider = memo(({ children }: { children: ReactNode }) => {
  const { useOptimizedTheme } = useLocalSettings()

  return (
    <MuiThemeProvider theme={useOptimizedTheme ? eInkTheme : theme}>
      <CssBaseline />
      {/* Chakra seems to be very well scoped so it's okay to wrap it on app level even if it's used 
      only by the reader. We may as well use chakra components here and there when needed */}
      <NextThemes
        attribute="class"
        // for now we use light mode on oboku so we need to force it
        // as well here otherwise it would creaste inconsistency
        forcedTheme="light"
      >
        <ChakraProvider value={useOptimizedTheme ? einkSystem : defaultSystem}>
          {children}
        </ChakraProvider>
      </NextThemes>
    </MuiThemeProvider>
  )
})
