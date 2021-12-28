import { Box, Button, Link, Typography, useTheme } from '@material-ui/core';
import { LanguageRounded } from '@material-ui/icons';
import landingLogoAsset from './assets/landing-logo.svg';
import { BetaRegister } from './BetaRegister'
import { OrDivider } from './OrDivider'

export const Home = () => {
  const theme = useTheme()

  return (
    <div style={{
      display: 'flex',
      flex: 1,
      flexFlow: 'column',
      alignItems: 'center',
    }}>
      <Box className="App" style={{
        padding: theme.spacing(3),
        display: 'flex',
        flex: 1,
        flexFlow: 'column',
        alignItems: 'center',
      }}>
        <header className="App-header" style={{ paddingBottom: theme.spacing(3) }}>
          <Typography variant="h1"><b style={{ color: theme.palette.primary.main }}>o</b><b>boku</b></Typography>
        </header>
        <img
          style={{
            width: 200
          }}
          src={landingLogoAsset}
          alt="logo"
        />
        <div style={{
          paddingTop: theme.spacing(3),
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          flexFlow: 'column'
        }}>
          <Typography variant="body1" style={{ fontWeight: 'normal', paddingBottom: theme.spacing(1) }}>
            Your personal reading cloud library. Read your own book from anywhere.
            <br/>Please visit <Link href="https://docs.oboku.me">https://docs.oboku.me</Link> for more information
          </Typography>
          {/* <Typography variant="body2" style={{ paddingBottom: theme.spacing(3) }}>To learn more about the project please visit <a href="https://github.com/mbret/oboku" target="__blank">github</a></Typography> */}
          <div style={{ paddingBottom: theme.spacing(3) }} />
          <BetaRegister />
          <OrDivider />
          <Button
            variant="contained"
            size="large"
            color="primary"
            href="https://app.oboku.me"
            target="_blank"
            startIcon={<LanguageRounded />}
            style={{
              minWidth: 300,
            }}
          >Access the app</Button>
          {/* <Button
            variant="outlined"
            size="large"
            color="primary"
            href="https://drive.google.com/drive/folders/1yPpzwMW6PFw3g9P_ed82M4jzvQZxhioG?usp=sharing"
            target="_blank"
            startIcon={<AndroidRounded />}
            style={{
              minWidth: 300,
              marginTop: theme.spacing(1)
            }}
          >Get the app for android</Button> */}
        </div>
      </Box>
      <footer style={{
        paddingBottom: theme.spacing(5),
        textAlign: 'center',
      }}>
        <Typography>
          © Copyright <Link color="primary" href="https://www.linkedin.com/in/maxime-bret/" rel="nofollow noopener noreferrer" target="_blank">Maxime Bret</Link>.
        </Typography>
      </footer>
    </div>
  );
}
