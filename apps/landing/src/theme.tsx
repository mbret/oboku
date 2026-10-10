"use client"

import type {} from "@mui/material/themeCssVarsAugmentation"
import { createTheme, lighten } from "@mui/material/styles"
import { design } from "@oboku/shared"

const hoverOrangeForDarkText = lighten(design.palette.orangeLight, 0.2)

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
          main: design.palette.orangeLight,
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
