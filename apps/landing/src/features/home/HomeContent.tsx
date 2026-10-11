import { Box, Container, Typography } from "@mui/material"
import comicReaderScreenshot from "./assets/oboku-git-develop-mbret.vercel.app_library_books(iPhone SE) (1).png"
import libraryScreenshot from "./assets/oboku-git-develop-mbret.vercel.app_library_books(iPhone SE).png"
import { GetStartedActions } from "../common/GetStartedActions"
import { GetStartedBanner } from "../common/GetStartedBanner"
import { GlowHeroSection } from "../common/GlowHeroSection"
import { PhoneScreenshots } from "../common/PhoneScreenshots"
import { landingDescription, landingTagline } from "./content"
import { FaqSection } from "./FaqSection"
import { FeatureOverviewSection } from "./FeatureOverviewSection"
import { HeroLayoutBox, HeroTextStack } from "./HomeContent.styled"
import { HowItWorksSection } from "./HowItWorksSection"
import { LastWords } from "./LastWords"

export function HomeContent() {
  return (
    <Box component="main">
      <GlowHeroSection>
        <Container>
          <HeroLayoutBox>
            <HeroTextStack>
              <Typography
                component="h1"
                sx={{ display: "flex", flexDirection: "column", gap: 1 }}
              >
                <Typography
                  variant="h5"
                  component="span"
                  sx={{ color: "primary.main", fontWeight: 700 }}
                >
                  oboku
                </Typography>{" "}
                <Typography
                  variant="h3"
                  component="span"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: "2.25rem", sm: "3rem" },
                  }}
                >
                  {landingTagline}
                </Typography>
              </Typography>
              <Typography
                variant="h6"
                component="p"
                sx={{ fontWeight: 400, color: "text.secondary", maxWidth: 560 }}
              >
                {landingDescription}
              </Typography>
              <GetStartedActions />
            </HeroTextStack>
            <PhoneScreenshots
              primary={{
                src: libraryScreenshot,
                alt: "oboku library view showing a collection of books on mobile",
              }}
              secondary={{
                src: comicReaderScreenshot,
                alt: "oboku book reader interface on mobile",
              }}
              preload
            />
          </HeroLayoutBox>
        </Container>
      </GlowHeroSection>
      <HowItWorksSection />
      <FeatureOverviewSection />
      <FaqSection />
      <LastWords />
      <Container sx={{ pt: { xs: 8, md: 12 } }}>
        <GetStartedBanner />
      </Container>
    </Box>
  )
}
