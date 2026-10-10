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
import { landingDescription, landingTagline } from "./content"
import { FaqSection } from "./FaqSection"
import { LastWords } from "./LastWords"
import Image from "next/image"

const syncProviders = [
  { label: "Google Drive", docsPath: "sync-providers/google-drive" },
  { label: "Dropbox", docsPath: "sync-providers/dropbox" },
  { label: "OneDrive", docsPath: "sync-providers/one-drive" },
  { label: "Synology", docsPath: "sync-providers/synology-drive" },
  { label: "WebDAV", docsPath: "sync-providers/webdav" },
]

const supportedExtensions = [".epub", ".cbz", ".cbr", ".pdf", ".txt"]

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
      style={{
        display: "flex",
        flex: 1,
        flexFlow: "column",
        alignItems: "center",
      }}
      sx={{
        pt: [12, 16],
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
        <Box
          component="header"
          sx={{
            mb: 2,
          }}
        >
          <Typography
            variant="h2"
            component="h1"
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <Typography variant="h2" component="span">
              oboku
            </Typography>{" "}
            <Typography variant="h5" component="span">
              {landingTagline}
            </Typography>
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
            variant="subtitle1"
            component="p"
            style={{ fontWeight: "normal", paddingBottom: theme.spacing(1) }}
          >
            {landingDescription}
          </Typography>
          <div style={{ paddingBottom: theme.spacing(3) }} />
          <Box
            sx={{
              width: "100%",
              maxWidth: 320,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                width: "100%",
                maxWidth: 300,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  flexDirection: "column",
                  width: "100%",
                }}
              >
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
                  href={links.documentationSelfHosting}
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
        sx={{
          mt: [4, 6],
          gap: 2,
          width: "100%",
          maxWidth: 632,
          px: 2,
          alignItems: ["center", "stretch"],
          flexDirection: ["column", "row"],
        }}
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
          <HighlightImage
            alt="oboku library view showing a collection of books on mobile"
            src={image1}
          />
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
          <HighlightImage
            alt="oboku book reader interface on mobile"
            src={image2}
          />
        </Paper>
      </Stack>
      <Box
        sx={{
          mt: [6, 7],
          width: "100%",
        }}
      >
        <Container>
          <Stack
            sx={{
              gap: 2,
            }}
          >
            <Typography variant="h4" component="h2">
              What is oboku?
            </Typography>
            <Typography>
              Oboku is a free and open-source ebook and comic reader that runs
              in your web browser. Instead of uploading your books to yet
              another service, you connect the places where they already live
              and oboku builds your library from them, on every device. Use the
              cloud version, or self-host it to keep everything under your
              control.
            </Typography>
            <Stack
              sx={{
                gap: 1,
              }}
            >
              <Typography variant="h5" component="h3">
                Synchronize from anywhere
              </Typography>
              <Typography
                sx={{
                  color: "text.secondary",
                }}
              >
                Access and synchronize your library from your own server, your
                device, or external providers.
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                  }}
                >
                  Examples:
                </Typography>
                {syncProviders.map(function renderSyncProviderChip({
                  label,
                  docsPath,
                }) {
                  return (
                    <Chip
                      key={label}
                      label={label}
                      size="small"
                      variant="outlined"
                      component="a"
                      href={`${links.documentation}/${docsPath}`}
                      target="_blank"
                      clickable
                    />
                  )
                })}
              </Box>
            </Stack>
            <Stack
              sx={{
                gap: 1,
              }}
            >
              <Typography variant="h5" component="h3">
                Supported formats
              </Typography>
              <Typography
                sx={{
                  color: "text.secondary",
                }}
              >
                Read ebooks, audiobooks, comics and various types of documents
                in one place.
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                  }}
                >
                  Examples:
                </Typography>
                {supportedExtensions.map(
                  function renderSupportedExtensionChip(extension) {
                    return (
                      <Chip
                        key={extension}
                        label={extension}
                        size="small"
                        variant="outlined"
                      />
                    )
                  },
                )}
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                }}
              >
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
      <Box
        sx={{
          mt: [4, 5],
          mb: [8, 8],
        }}
      >
        <AppHighlightSection />
      </Box>
      <Box
        sx={{
          mb: [8, 8],
        }}
      >
        <FaqSection />
      </Box>
      <LastWords />
    </Box>
  )
}
