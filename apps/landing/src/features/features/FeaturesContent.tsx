"use client"

import {
  alpha,
  Box,
  Chip,
  Container,
  Stack,
  styled,
  Typography,
} from "@mui/material"
import { GetStartedActions } from "../common/GetStartedActions"
import { GetStartedBanner } from "../common/GetStartedBanner"
import { GlowHeroSection } from "../common/GlowHeroSection"
import { outlinedCardStyles } from "../common/outlinedCardStyles"
import { featureGroups, featureHighlights } from "./content"
import { FeatureGroupSection } from "./FeatureGroupSection"

const HighlightsBox = styled(Box)(function styleHighlightsBox({ theme }) {
  return {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: theme.spacing(2),
    marginTop: theme.spacing(6),
    [theme.breakpoints.up("md")]: {
      gridTemplateColumns: "repeat(4, 1fr)",
    },
  }
})

const HighlightStack = styled(Stack)(function styleHighlightStack({ theme }) {
  return {
    ...outlinedCardStyles(theme),
    gap: theme.spacing(0.5),
    padding: theme.spacing(2.5),
    textAlign: "center",
  }
})

const SectionNav = styled("nav")(function styleSectionNav({ theme }) {
  return {
    position: "sticky",
    top: 56,
    zIndex: theme.zIndex.appBar - 1,
    backgroundColor: alpha(theme.palette.background.paper, 0.9),
    backdropFilter: "blur(8px)",
    borderTop: `1px solid ${theme.palette.divider}`,
    borderBottom: `1px solid ${theme.palette.divider}`,
    [theme.breakpoints.up("sm")]: {
      top: 64,
    },
  }
})

const SectionNavStack = styled(Stack)(function styleSectionNavStack({ theme }) {
  return {
    flexDirection: "row",
    gap: theme.spacing(1),
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    overflowX: "auto",
    scrollbarWidth: "none",
    [theme.breakpoints.up("md")]: {
      justifyContent: "center",
    },
  }
})

export function FeaturesContent() {
  return (
    <Box component="main">
      <GlowHeroSection>
        <Container maxWidth="md">
          <Stack sx={{ alignItems: "center", textAlign: "center", gap: 2 }}>
            <Chip label="Features" color="primary" variant="outlined" />
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
