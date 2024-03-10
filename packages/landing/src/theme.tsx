"use client"

import { createTheme } from "@mui/material/styles"
import { design } from "@oboku/shared"

export const theme = createTheme({
  palette: {
    primary: {
      main: design.palette.orange
    },
    text: {
      // primary: "#505256"
    }
  },
  components: {
    MuiTypography: {
      styleOverrides: {
        body1: {
          // color: "#505256"
        }
      }
    },
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
