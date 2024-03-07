import { createTheme } from "@mui/material/styles"
import { design } from "@oboku/shared"

export const theme = createTheme({
  palette: {
    primary: {
      main: design.palette.orange
    }
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true
      },
      styleOverrides: {
        root: {
          textTransform: "capitalize"
        }
      }
    }
  }
})
