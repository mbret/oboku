import {
  Alert,
  alpha,
  Box,
  Button,
  createSvgIcon,
  Link,
  Typography,
  useTheme
} from "@mui/material"
import {
  GitHub,
  LanguageRounded,
  LinkRounded,
  OpenInNewOutlined,
  OpenInNewRounded,
  TabletMacRounded
} from "@mui/icons-material"
import landingLogoAsset from "./assets/landing-logo.svg"
import { BetaRegister } from "./BetaRegister"
import { OrDivider } from "./OrDivider"
import { links } from "@oboku/shared"
import { ReactNode } from "react"
import { DiscordMarkBlueIcon } from "./assets/DiscordMarkBlueIcon"

const ButtonsContainer = ({ children }: { children: ReactNode }) => {
  return (
    <Box
      display="flex"
      gap={2}
      flexDirection="column"
      maxWidth={300}
      width="100%"
    >
      <>{children}</>
    </Box>
  )
}

export const Home = () => {
  const theme = useTheme()

  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        flexFlow: "column",
        alignItems: "center"
      }}
    >
      <Box
        className="App"
        style={{
          padding: theme.spacing(3),
          display: "flex",
          flex: 1,
          flexFlow: "column",
          alignItems: "center"
        }}
      >
        <header
          className="App-header"
          style={{ paddingBottom: theme.spacing(3) }}
        >
          <Typography variant="h1">
            <b style={{ color: theme.palette.primary.main }}>o</b>
            <b>boku</b>
          </Typography>
        </header>
        <img
          style={{
            width: 200
          }}
          src={landingLogoAsset}
          alt="logo"
        />
        <div
          style={{
            paddingTop: theme.spacing(3),
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            flexFlow: "column"
          }}
        >
          <Typography
            variant="body1"
            style={{ fontWeight: "normal", paddingBottom: theme.spacing(1) }}
          >
            Your personal reading cloud library. Read your own book from
            anywhere.
            <br />
            Please visit{" "}
            <Link href={links.documentation} target="_blank">
              {links.documentation}
            </Link>{" "}
            for more information and join us on{" "}
            <Link href={links.discord} target="_blank">
              discord
            </Link>
          </Typography>
          <Alert severity="info">
            <b>oboku</b> is a working product but still in{" "}
            <b>active development</b>! Documentations and resources are under
            construction and we need your feedback to improve the product.
          </Alert>
          <div style={{ paddingBottom: theme.spacing(3) }} />
          <BetaRegister />
          <OrDivider />
          <ButtonsContainer>
            <Button
              variant="outlined"
              size="large"
              color="primary"
              href={links.app}
              target="_blank"
              startIcon={<TabletMacRounded />}
              endIcon={<OpenInNewOutlined />}
            >
              Access the app
            </Button>
          </ButtonsContainer>
          <OrDivider title="more" />
          <ButtonsContainer>
            <Button
              variant="outlined"
              color="primary"
              href={links.documentation}
              target="_blank"
              endIcon={<OpenInNewOutlined />}
            >
              documentation
            </Button>
            <Button
              variant="outlined"
              href={links.discord}
              target="_blank"
              startIcon={<DiscordMarkBlueIcon />}
              endIcon={<OpenInNewOutlined />}
              sx={({ palette }) => ({
                borderColor: "#5865f2",
                color: "#5865f2",
                "&:hover": {
                  backgroundColor: alpha(
                    "#5865f2",
                    palette.action.hoverOpacity
                  ),
                  borderColor: "#5865f2"
                },
                "&:active": {
                  borderColor: "#5865f2"
                }
              })}
            >
              discord
            </Button>
            <Button
              variant="outlined"
              href={links.github}
              target="_blank"
              startIcon={<GitHub />}
              endIcon={<OpenInNewOutlined />}
              sx={({ palette }) => ({
                borderColor: "black",
                color: "black",
                "&:hover": {
                  backgroundColor: alpha(
                    "#000000",
                    palette.action.hoverOpacity
                  ),
                  borderColor: "black"
                },
                "&:active": {
                  borderColor: "black"
                }
              })}
            >
              github
            </Button>
          </ButtonsContainer>
        </div>
      </Box>
      <footer
        style={{
          paddingBottom: theme.spacing(5),
          textAlign: "center"
        }}
      >
        <Typography>
          © Copyright{" "}
          <Link
            color="primary"
            href={links.linkedin}
            rel="nofollow noopener noreferrer"
            target="_blank"
            underline="hover"
          >
            Maxime Bret
          </Link>
          .
        </Typography>
      </footer>
    </div>
  )
}
