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
    MuiTabs: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderBottomWidth: 1,
          borderBottomStyle: "solid",
          borderBottomColor: theme.palette.divider
        })
      }
    },
    MuiTab: {
      defaultProps: {
        disableFocusRipple: true,
        disableTouchRipple: true,
        disableRipple: true
      }
    },
    /**
     * @see https://github.com/mui/material-ui/blob/master/packages/mui-material/src/Button/Button.js
     */
    MuiButton: {
      defaultProps: {
        focusRipple: false,
        disableElevation: true,
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
    MuiBottomNavigation: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderTopColor: theme.palette.primary.main,
          borderTopWidth: 1,
          borderTopStyle: "solid",
          height: `calc(56px + env(safe-area-inset-bottom))`
        })
      }
    },
    // Name of the component ⚛️
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: ({ theme }) => ({
          // disable the lift up effect when an icon is selected
          padding: "0 !important",
          [theme.breakpoints.down("sm")]: {
            // avoid H scrolling on small screen due to many icons
            minWidth: "60px"
          }
        })
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
      defaultProps: {},
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
    },
    MuiLink: {
      defaultProps: {
        underline: "hover"
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
        light: "#2d2d2d",
        dark: "#000000",
        main: "#000000",
        contrastText: "#ffffff"
      },
      success: {
        main: "#000000"
      },
      error: {
        main: "#000000"
      },
      info: {
        main: "#000000",
        dark: "#000000",
        light: "#000000"
      }
    },
    components: {
      ObokuScrubber: {
        defaultProps: {
          contrastMode: true
        }
      },
      MuiAppBar: {
        defaultProps: {
          elevation: 0
        },
        styleOverrides: {
          root: ({ ownerState }) => {
            return {
              color: "black",
              backgroundColor: "white",
              ...(ownerState.color !== "transparent" && {
                borderBottom: "1px solid black"
              })
            }
          }
        }
      },
      MuiLink: {
        defaultProps: {
          underline: "always"
        }
      },
      MuiButton: {
        defaultProps: {
          disableRipple: true
        }
      },
      MuiBottomNavigationAction: {
        defaultProps: {
          disableRipple: true,
          disableTouchRipple: true
        },
        styleOverrides: {
          root: {
            "&.Mui-selected": {
              "&::after": {
                content: '""',
                display: `block`,
                width: 30,
                height: `12px`,
                borderBottom: "2px solid black",
                position: "absolute",
                bottom: "18%"
              }
            }
          }
        }
      }
    },
    custom: theme.custom
  } satisfies Parameters<typeof createTheme>[0])
)
