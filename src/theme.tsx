/**
 * @see https://material-ui.com/customization/default-theme/
 * @see https://material-ui.com/customization/palette/
 */
import { createMuiTheme } from '@material-ui/core/styles'
import { grey } from '@material-ui/core/colors';

const light = 'rgba(0, 0, 0, 0.38)'
const main = 'rgba(0, 0, 0, 0.54)'
const dark = 'rgba(0, 0, 0, 0.87)'

export const theme = createMuiTheme({
  palette: {
    primary: {
      // light,
      main: grey[700],
      // main,
      // dark,
    },
      // text: {
      //   primary: 'rgb(255, 255, 255)',
      // },
    //   secondary: {
    //     light,
    //     main,
    //     dark,
    //   },
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
  }
});