/**
 * @see https://material-ui.com/customization/default-theme/
 * @see https://material-ui.com/customization/palette/
 */
import { createTheme, alpha } from "@mui/material/styles"
import { deepmerge } from "@mui/utils"

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
  palette: {
    mode: `light`,
    primary: {
      light: `#E7835B`,
      main: "#e16432", // #e16432
      dark: `#9D4623`
    }
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
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6
        },
        sizeSmall: {
          borderRadius: 6
        },
        sizeMedium: {
          borderRadius: 6
        }
      }
    }
  },
  custom: {
    maxWidthCenteredContent: 320,

    // Average ratio (w/h) for books cover. This ratio may be used
    // to help designing fixed height carousel or card. This average takes
    // into account the deviation
    coverAverageRatio: 9 / 14
  }
})

export const eInkTheme = createTheme(
  deepmerge(theme, {
    transitions: {
      // So we have `transition: none;` everywhere
      create: () => "none"
    },
    palette: {
      text: {
        primary: "#000000",
        secondary: "#000000"
      },
      primary: {
        main: "#fff",
        contrastText: "#000000"
      }
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            borderBottom: "1px solid black"
          }
        }
      }
    },
    custom: theme.custom
  } satisfies Parameters<typeof createTheme>[0])
)
