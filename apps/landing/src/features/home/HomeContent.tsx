"use client"

import {
  Box,
  Button,
  Container,
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
        mt={[4, 8]}
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
      <Box my={[8, 8]}>
        <AppHighlightSection />
      </Box>
      <LastWords />
    </Box>
  )
}
