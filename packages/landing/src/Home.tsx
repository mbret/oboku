import {
  Alert,
  alpha,
  Box,
  Button,
  Link,
  Paper,
  Stack,
  styled,
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
import image2 from "./assets/oboku-git-develop-mbret.vercel.app_library_books(iPhone SE) (1).png"
import image1 from "./assets/oboku-git-develop-mbret.vercel.app_library_books(iPhone SE).png"
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

const HighlightImage = styled(`img`)`
  max-width: 300px;
`

export const Home = () => {
  const theme = useTheme()

  return (
    <Box
      pt={[12, 16]}
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
        <Box component="header" mb={2}>
          <Typography variant="h2" component="h1">
            {/* <span style={{ color: theme.palette.primary.main }}>o</span>
            boku */}
            oboku
          </Typography>
        </Box>
        {/* <img
          style={{
            width: 200
          }}
          src={landingLogoAsset}
          alt="logo"
        /> */}
        <div
          style={{
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
            Your books, your cloud: Access, read and sync your personal library
            from your cloud, anytime, anywhere.
          </Typography>
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
                >
                  Get started
                </Button>
              </ButtonsContainer>
            </Box>
          </Box>
        </div>
      </Box>
      <Stack mt={[4, 8]} gap={2} flexDirection={["column", "row"]}>
        <Paper
          elevation={4}
          sx={{
            overflow: "hidden",
            borderRadius: 2
          }}
        >
          <HighlightImage
            width="100%"
            style={{ display: "block" }}
            src={image1}
          />
        </Paper>
        <Paper
          elevation={4}
          sx={{
            overflow: "hidden",
            borderRadius: 2
          }}
        >
          <HighlightImage
            width="100%"
            style={{ display: "block" }}
            src={image2}
          />
        </Paper>
      </Stack>
      <Box mt={[5, 8]}>
        <AppHighlightSection />
      </Box>
    </Box>
  )
}
