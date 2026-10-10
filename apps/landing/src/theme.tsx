"use client"

import type {} from "@mui/material/themeCssVarsAugmentation"
import { createTheme, lighten } from "@mui/material/styles"
import { design } from "@oboku/shared"

const hoverOrangeForDarkText = lighten(design.palette.orangeHex, 0.2)

export const theme = createTheme({
  cssVariables: true,
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: design.palette.orangeOnLightHex,
        },
      },
    },
    dark: {
      palette: {
        contrastThreshold: 4.5,
        primary: {
          main: design.palette.orangeHex,
          dark: hoverOrangeForDarkText,
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
