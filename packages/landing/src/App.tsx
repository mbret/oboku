import { ThemeProvider, StyledEngineProvider } from "@mui/material";
import { theme } from "./theme";
import { Home } from "./Home";
import CssBaseline from "@mui/material/CssBaseline";

export function App() {
  return (
    <>
      <CssBaseline />
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <Home />
        </ThemeProvider>
      </StyledEngineProvider>
    </>
  );
}
