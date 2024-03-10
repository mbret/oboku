"use client"

import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  styled,
  Typography,
  useTheme
} from "@mui/material"
import image2 from "./assets/oboku-git-develop-mbret.vercel.app_library_books(iPhone SE) (1).png"
import image1 from "./assets/oboku-git-develop-mbret.vercel.app_library_books(iPhone SE).png"
import { links } from "@oboku/shared"
import { ReactNode } from "react"
import { AppHighlightSection } from "./AppHighlightSection"
import { LastWords } from "./LastWords"
import Image from "next/image"

const ButtonsContainer = ({ children }: { children: ReactNode }) => {
  return (
    <Box display="flex" gap={2} flexDirection="column" width="100%">
      <>{children}</>
    </Box>
  )
}

const HighlightImage = styled(Image)`
  max-width: 300px;
  height: auto;
`

export const HomeContent = () => {
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
    >
      <Container
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
            Your books, your cloud! Access, read and sync your personal library
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
      </Container>
      <Stack mt={[4, 8]} gap={2} flexDirection={["column", "row"]}>
        <Paper
          elevation={4}
          sx={{
            overflow: "hidden",
            borderRadius: 2
          }}
        >
          <HighlightImage
            alt="Showcase image 1"
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
            alt="Showcase image 2"
            style={{ display: "block" }}
            src={image2}
          />
        </Paper>
      </Stack>
      <Box my={[8, 8]}>
        <AppHighlightSection />
      </Box>
      <LastWords />
    </Box>
  )
}
