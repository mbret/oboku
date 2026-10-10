import { Box, Chip, Container, Stack, Typography } from "@mui/material"
import { GetStartedActions } from "../common/GetStartedActions"
import { GetStartedBanner } from "../common/GetStartedBanner"
import { GlowHeroSection } from "../common/GlowHeroSection"
import { featureGroups, featureHighlights } from "./content"
import { FeatureGroupSection } from "./FeatureGroupSection"
import {
  HighlightsBox,
  HighlightStack,
  SectionNav,
  SectionNavStack,
} from "./FeaturesContent.styled"

export function FeaturesContent() {
  return (
    <Box component="main">
      <GlowHeroSection>
        <Container maxWidth="md">
          <Stack sx={{ alignItems: "center", textAlign: "center", gap: 2 }}>
            <Chip
              label="Features"
              color="primary"
              variant="outlined"
              // The hero glow is strongest here: without a solid backdrop the
              // label drops below WCAG AA, which Lighthouse cannot measure.
              sx={{ bgcolor: "background.paper" }}
            />
            <Typography
              variant="h3"
              component="h1"
              sx={{ fontWeight: 700, fontSize: { xs: "2.25rem", sm: "3rem" } }}
            >
              Everything you need to read your library, anywhere
            </Typography>
            <Typography
              variant="h6"
              component="p"
              sx={{ fontWeight: 400, color: "text.secondary", maxWidth: 640 }}
            >
              Ebooks, comics and manga from the storage you already use, in one
              reader that works offline on every device. Free and open source.
            </Typography>
            <GetStartedActions />
          </Stack>
          <HighlightsBox>
            {featureHighlights.map(function renderHighlight({ value, label }) {
              return (
                <HighlightStack key={value}>
                  <Typography
                    variant="h6"
                    component="p"
                    sx={{ fontWeight: 700 }}
                  >
                    {value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {label}
                  </Typography>
                </HighlightStack>
              )
            })}
          </HighlightsBox>
        </Container>
      </GlowHeroSection>
      <SectionNav aria-label="Feature categories">
        <Container>
          <SectionNavStack>
            {featureGroups.map(function renderSectionLink({ id, navLabel }) {
              return (
                <Chip
                  key={id}
                  label={navLabel}
                  component="a"
                  href={`#${id}`}
                  clickable
                  variant="outlined"
                />
              )
            })}
          </SectionNavStack>
        </Container>
      </SectionNav>
      {featureGroups.map(function renderFeatureGroup(group, index) {
        return (
          <FeatureGroupSection
            key={group.id}
            group={group}
            isAlternate={index % 2 === 1}
          />
        )
      })}
      <Container>
        <GetStartedBanner />
      </Container>
    </Box>
  )
}
