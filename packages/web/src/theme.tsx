/**
 * @see https://material-ui.com/customization/default-theme/
 * @see https://material-ui.com/customization/palette/
 */
import { createTheme, alpha } from "@mui/material/styles"

declare module "@mui/material/styles" {
  interface Theme {
    custom: {
      maxWidthCenteredContent: number
      coverAverageRatio: number
    }
  }
  interface ThemeOptions {
    custom: {
      maxWidthCenteredContent: number
      coverAverageRatio: number
    }
  }
}

export const theme = createTheme({
  transitions: {
    // So we have `transition: none;` everywhere
    create: () => "none"
  },
  palette: {
    mode: `light`,
    primary: {
      light: `#E7835B`,
      main: "#e16432", // #e16432
      dark: `#9D4623`
    }
    // text: {
    //   primary: 'rgb(255, 255, 255)',
    // },
    // secondary: {
    // light,
    // main: "rgb(225, 100, 50, 1)"
    // dark,
    // }
  },
  components: {
    /**
     * @see https://github.com/mui/material-ui/blob/master/packages/mui-material/src/Button/Button.js
     */
    MuiButton: {
      defaultProps: {
        focusRipple: false,
        variant: "outlined"
      },
      styleOverrides: {
        root: ({ theme, ownerState }) => ({
          "&:focus": {
            boxShadow: `0 0 0 0.2rem ${alpha(
              theme.palette[ownerState.color ?? "primary"].main,
              0.5
            )}`
          }
        })
      }
    },
    // Name of the component ⚛️
    MuiCssBaseline: {
      // Name of the rule
      // "@global": {
      //   "*, *::before, *::after": {
      //     transition: "none !important",
      //     animation: "none !important"
      //   }
      // }
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          // disable the lift up effect when an icon is selected
          padding: "0 !important"
        }
      }
    },
    MuiListItem: {
      styleOverrides: {
        secondaryAction: {
          // paddingRight: 70
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paperWidthSm: {
          minWidth: 260
        }
      }
    },
    // MuiBottomNavigationAction: {
    //   root: {
    //     paddingTop: '0 !important',
    //   }
    // }
    MuiButtonBase: {
      styleOverrides: {
        root: {
          // color: '#fff',
        }
      }
    }
    // MuiButton: {
    //   root: {
    //     color: "#fff"
    //   },
    //   outlined: {
    //     border: "1px solid rgba(255, 255, 255, 1)"
    //     // color: '#fff',
    //   }
    // }
  },
  custom: {
    maxWidthCenteredContent: 320,

    // Average ratio (w/h) for books cover. This ratio may be used
    // to help designing fixed height carousel or card. This average takes
    // into account the deviation
    coverAverageRatio: 9 / 14
  }
})
