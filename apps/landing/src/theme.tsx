"use client"

import type {} from "@mui/material/themeCssVarsAugmentation"
import { createTheme } from "@mui/material/styles"
import { design } from "@oboku/shared"

export const theme = createTheme({
  cssVariables: true,
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: design.palette.orange,
        },
      },
    },
    dark: {
      palette: {
        contrastThreshold: 4.5,
        primary: {
          main: design.palette.orange,
        },
      },
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {},
      },
    },
  },
})
