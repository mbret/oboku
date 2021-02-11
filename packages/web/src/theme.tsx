/**
 * @see https://material-ui.com/customization/default-theme/
 * @see https://material-ui.com/customization/palette/
 */
import { createMuiTheme } from '@material-ui/core/styles'

declare module "@material-ui/core/styles" {
  interface Theme {
    custom: {
      maxWidthCenteredContent: number,
      coverAverageRatio: number,
    }
  }
  interface ThemeOptions {
    custom: {
      maxWidthCenteredContent: number,
      coverAverageRatio: number,
    }
  }
}

const light = 'rgba(0, 0, 0, 0.38)'
const main = 'rgba(0, 0, 0, 0.54)'
const dark = 'rgba(0, 0, 0, 0.87)'

export const theme = createMuiTheme({
  palette: {
    primary: {
      // light,
      // main: grey[700],
      // main: '#FF7863',
      // main: '#FF6363',
      main: 'rgb(225, 100, 50, 1)', // #e16432
      // main: '#ff5722', 
      // main,
      // dark,
    },
    // text: {
    //   primary: 'rgb(255, 255, 255)',
    // },
    secondary: {
      // light,
      main,
      // dark,
    },
  },
  transitions: {
    // So we have `transition: none;` everywhere
    create: () => 'none',
  },
  // @see https://material-ui.com/getting-started/faq/
  overrides: {
    // Name of the component ⚛️
    MuiCssBaseline: {
      // Name of the rule
      '@global': {
        '*, *::before, *::after': {
          transition: 'none !important',
          animation: 'none !important',
        },
      },
    },
    MuiBottomNavigation: {
      root: {

      }
    },
    MuiBottomNavigationAction: {
      root: {
        // disable the lift up effect when an icon is selected
        padding: '0 !important'
      },
    },
    MuiListItem: {
      secondaryAction: {
        // paddingRight: 70
      },
    },
    MuiDialog: {
      paperWidthSm: {
        minWidth: 260,
      }
    },
    // MuiBottomNavigationAction: {
    //   root: {
    //     paddingTop: '0 !important',
    //   }
    // }
    MuiButtonBase: {
      root: {
        // color: '#fff',
      }
    },
    MuiButton: {
      root: {
        color: '#fff',
      },
      outlined: {
        border: '1px solid rgba(255, 255, 255, 1)'
        // color: '#fff',
      }
    }
  },
  props: {
    // Name of the component ⚛️
    MuiButtonBase: {
      // The properties to apply
      disableRipple: true, // No more ripple, on the whole application 💣!
    },
  },
  zIndex: {
    
  },
  custom: {
    maxWidthCenteredContent: 320,

    // Average ratio (w/h) for books cover. This ratio may be used
    // to help designing fixed height carousel or card. This average takes
    // into account the deviation
    coverAverageRatio: 9 / 14,
  }
});