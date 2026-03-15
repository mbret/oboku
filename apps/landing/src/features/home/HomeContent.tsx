"use client"

import {
  Box,
  Button,
  Chip,
  Container,
  Link,
  Paper,
  Stack,
  styled,
  Typography,
  useTheme,
} from "@mui/material"
import image2 from "./assets/oboku-git-develop-mbret.vercel.app_library_books(iPhone SE) (1).png"
import image1 from "./assets/oboku-git-develop-mbret.vercel.app_library_books(iPhone SE).png"
import { links } from "@oboku/shared"
import { AppHighlightSection } from "./AppHighlightSection"
import { landingSubtitle } from "./content"
import { LastWords } from "./LastWords"
import Image from "next/image"

const HighlightImage = styled(Image)(({ theme }) => ({
  width: "100%",
  maxWidth: "100%",
  height: "auto",
  [theme.breakpoints.down("sm")]: {
    width: "auto",
    maxHeight: "50vh",
    margin: "0 auto",
  },
}))

export const HomeContent = () => {
  const theme = useTheme()

  return (
    <Box
      pt={[12, 16]}
      style={{
        display: "flex",
        flex: 1,
        flexFlow: "column",
        alignItems: "center",
      }}
    >
      <Container
        className="App"
        style={{
          display: "flex",
          flex: 1,
          flexFlow: "column",
          alignItems: "center",
        }}
      >
        <Box component="header" mb={2}>
          <Typography variant="h2" component="h1">
            oboku
          </Typography>
        </Box>
        <div
          style={{
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            flexFlow: "column",
            maxWidth: 600,
          }}
        >
          <Typography
            variant="body1"
            style={{ fontWeight: "normal", paddingBottom: theme.spacing(1) }}
          >
            {landingSubtitle}
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
              <Box display="flex" gap={2} flexDirection="column" width="100%">
                <Button
                  variant="contained"
                  size="large"
                  href={links.app}
                  target="_blank"
                >
                  Start using oboku
                </Button>
                <Button
                  // variant="outlined"
                  size="large"
                  href="https://docs.oboku.me/self-hosting/installation"
                  target="_blank"
                >
                  or Self host
                </Button>
              </Box>
            </Box>
          </Box>
        </div>
      </Container>
      <Stack
        mt={[4, 6]}
        gap={2}
        width="100%"
        maxWidth={632}
        px={2}
        alignItems={["center", "stretch"]}
        flexDirection={["column", "row"]}
      >
        <Paper
          elevation={4}
          sx={{
            display: "flex",
            justifyContent: "center",
            width: {
              xs: "fit-content",
              sm: "auto",
            },
            maxWidth: "100%",
            flex: {
              xs: "0 0 auto",
              sm: 1,
            },
            minWidth: 0,
            overflow: "hidden",
            borderRadius: 2,
          }}
        >
          <HighlightImage alt="Showcase image 1" src={image1} />
        </Paper>
        <Paper
          elevation={4}
          sx={{
            display: "flex",
            justifyContent: "center",
            width: {
              xs: "fit-content",
              sm: "auto",
            },
            maxWidth: "100%",
            flex: {
              xs: "0 0 auto",
              sm: 1,
            },
            minWidth: 0,
            overflow: "hidden",
            borderRadius: 2,
          }}
        >
          <HighlightImage alt="Showcase image 2" src={image2} />
        </Paper>
      </Stack>
      <Box mt={[6, 7]} width="100%">
        <Container>
          <Stack gap={2}>
            <Typography variant="h4" component="h2">
              What is oboku?
            </Typography>
            <Typography>
              Oboku is a cloud or self-hostable book reader built to keep your
              library under your control. What differentiates it from other
              solutions is the range of supported contents and the possibility
              to synchronize from external locations.
            </Typography>
            <Stack gap={1}>
              <Typography variant="h5" component="h3">
                Synchronize from anywhere
              </Typography>
              <Typography color="text.secondary">
                Access and synchronize your library from your own server, your
                device, or external providers.
              </Typography>
              <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                <Typography variant="body2" color="text.secondary">
                  Examples:
                </Typography>
                <Chip label="Google Drive" size="small" variant="outlined" />
                <Chip label="Dropbox" size="small" variant="outlined" />
                <Chip label="Synology" size="small" variant="outlined" />
                <Chip label="WebDAV" size="small" variant="outlined" />
              </Box>
            </Stack>
            <Stack gap={1}>
              <Typography variant="h5" component="h3">
                Supported formats
              </Typography>
              <Typography color="text.secondary">
                Read ebook, audiobooks, comics and various type of documents in
                one place.
              </Typography>
              <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                <Typography variant="body2" color="text.secondary">
                  Examples:
                </Typography>
                <Chip label=".epub" size="small" variant="outlined" />
                <Chip label=".cbz" size="small" variant="outlined" />
                <Chip label=".cbr" size="small" variant="outlined" />
                <Chip label=".pdf" size="small" variant="outlined" />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Oboku uses{" "}
                <Link
                  href="https://prose-reader.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Prose
                </Link>{" "}
                under the hood for its reader.
              </Typography>
            </Stack>
          </Stack>
        </Container>
      </Box>
      <Box mt={[4, 5]} mb={[8, 8]}>
        <AppHighlightSection />
      </Box>
      <LastWords />
    </Box>
  )
}
