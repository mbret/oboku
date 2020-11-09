/**
 * @see https://material-ui.com/customization/default-theme/
 * @see https://material-ui.com/customization/palette/
 */
import { createMuiTheme } from '@material-ui/core/styles'

const light = 'rgba(0, 0, 0, 0.38)'
const main = 'rgba(0, 0, 0, 0.54)'
const dark = 'rgba(0, 0, 0, 0.87)'

export const theme = createMuiTheme({
  palette: {
    primary: {
      light,
      main,
      dark,
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
  },
  props: {
    // Name of the component ⚛️
    MuiButtonBase: {
      // The properties to apply
      disableRipple: true, // No more ripple, on the whole application 💣!
    },
  }
});