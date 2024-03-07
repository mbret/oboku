import { ThemeProvider, StyledEngineProvider, Stack } from "@mui/material"
import { theme } from "./theme"
import { Home } from "./Home"
import CssBaseline from "@mui/material/CssBaseline"
import AppBar from "./AppBar"
import { Footer } from "./Footer"

export function App() {
  return (
    <>
      <CssBaseline />
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <AppBar />
          <Home />
          <Footer />
        </ThemeProvider>
      </StyledEngineProvider>
    </>
  )
}
