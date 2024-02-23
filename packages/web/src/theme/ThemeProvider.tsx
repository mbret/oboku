import { CssBaseline, ThemeProvider as MuiThemeProvider } from "@mui/material"
import { eInkTheme, theme } from "./theme"
import { ReactNode, memo } from "react"
import { useLocalSettings } from "../settings/states"

export const ThemeProvider = memo(({ children }: { children: ReactNode }) => {
  const { useOptimizedTheme } = useLocalSettings()

  return (
    <MuiThemeProvider theme={useOptimizedTheme ? eInkTheme : theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  )
})
