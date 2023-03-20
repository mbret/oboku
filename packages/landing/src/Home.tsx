import {
  Alert,
  alpha,
  Box,
  Button,
  Link,
  Typography,
  useTheme
} from "@mui/material"
import {
  AttachMoneyRounded,
  CloudDownloadRounded,
  DevicesFoldRounded,
  GitHub,
  LibraryBooksRounded,
  LocalLibraryRounded,
  LockOpenRounded,
  OpenInNewOutlined,
  PhonelinkRounded,
  SignalCellularOffRounded,
  StickyNote2Rounded,
  TabletMacRounded
} from "@mui/icons-material"
import landingLogoAsset from "./assets/landing-logo.svg"
import { OrDivider } from "./OrDivider"
import { links } from "@oboku/shared"
import { ReactNode } from "react"
import { DiscordMarkBlueIcon } from "./assets/DiscordMarkBlueIcon"

const ButtonsContainer = ({ children }: { children: ReactNode }) => {
  return (
    <Box display="flex" gap={2} flexDirection="column" width="100%">
      <>{children}</>
    </Box>
  )
}

const KeyPointItem = ({
  content,
  icon
}: {
  content: string
  icon: ReactNode
}) => {
  return (
    <Box
      display="flex"
      // border="1px solid black"
      flexDirection="column"
      alignItems="center"
      maxWidth={200}
      gap={2}
    >
      <>{icon}</>
      <Typography variant="body1">{content}</Typography>
    </Box>
  )
}

const AppHighlightSection = () => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      textAlign="center"
    >
      <Typography variant="overline" textAlign="center">
        In a few key points
      </Typography>
      <Typography variant="h2" component="h2">
        What is oboku?
      </Typography>
      <Typography variant="overline" textAlign="center">
        Let's see what makes oboku special
      </Typography>
      <Box mt={4} display="grid" gridTemplateColumns="1fr 1fr" gap={5}>
        <KeyPointItem content="Reading app" icon={<LocalLibraryRounded />} />
        <KeyPointItem content="Book library" icon={<LibraryBooksRounded />} />
        <KeyPointItem
          content="Read any content"
          icon={<StickyNote2Rounded />}
        />
        <KeyPointItem
          content="synchronize with your clouds providers"
          icon={<CloudDownloadRounded />}
        />
        <KeyPointItem
          content="Works on any device with a browser"
          icon={<PhonelinkRounded />}
        />
        <KeyPointItem content="E-ink support" icon={<DevicesFoldRounded />} />
        <KeyPointItem content="100% free" icon={<AttachMoneyRounded />} />
        <KeyPointItem
          content="100% offline"
          icon={<SignalCellularOffRounded />}
        />
        <KeyPointItem content="100% open source" icon={<LockOpenRounded />} />
      </Box>
    </Box>
  )
}

export const Home = () => {
  const theme = useTheme()

  return (
    <Box
      style={{
        display: "flex",
        flex: 1,
        flexFlow: "column",
        alignItems: "center"
      }}
      paddingX={3}
    >
      <Box
        className="App"
        style={{
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
            flexFlow: "column",
            maxWidth: 600
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
          <Box
            width="100%"
            maxWidth={320}
            display="flex"
            flexDirection="column"
            alignItems="center"
          >
            <Box width="100%" maxWidth={300}>
              <ButtonsContainer>
                <Button
                  variant="contained"
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
            </Box>

            <OrDivider title="more" />
            <Box width="100%" maxWidth={300}>
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
                  color="primary"
                  startIcon={<DiscordMarkBlueIcon />}
                  endIcon={<OpenInNewOutlined />}
                >
                  discord
                </Button>
                <Button
                  variant="outlined"
                  href={links.github}
                  target="_blank"
                  color="primary"
                  startIcon={<GitHub />}
                  endIcon={<OpenInNewOutlined />}
                >
                  github
                </Button>
              </ButtonsContainer>
            </Box>
          </Box>
        </div>
      </Box>
      <Box mt={[5, 8]}>
        <AppHighlightSection />
      </Box>
      <Box
        mt={10}
        component="footer"
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
      </Box>
    </Box>
  )
}
