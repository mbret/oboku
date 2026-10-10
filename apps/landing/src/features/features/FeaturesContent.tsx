"use client"

import {
  alpha,
  Box,
  Button,
  Chip,
  Container,
  Stack,
  styled,
  Typography,
} from "@mui/material"
import { links } from "@oboku/shared"
import { featureGroups, featureHighlights } from "./content"
import { FeatureGroupSection } from "./FeatureGroupSection"

const HeroSection = styled("section")(function styleHeroSection({ theme }) {
  return {
    paddingTop: theme.spacing(14),
    paddingBottom: theme.spacing(6),
    background: `radial-gradient(ellipse at top, ${alpha(theme.palette.primary.main, 0.12)}, transparent 70%)`,
    [theme.breakpoints.up("sm")]: {
      paddingTop: theme.spacing(18),
      paddingBottom: theme.spacing(8),
    },
  }
})

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
    gap: theme.spacing(0.5),
    padding: theme.spacing(2.5),
    borderRadius: theme.spacing(1.5),
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
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

const CallToActionStack = styled(Stack)(function styleCallToActionStack({
  theme,
}) {
  return {
    alignItems: "center",
    textAlign: "center",
    gap: theme.spacing(2),
    padding: theme.spacing(6, 3),
    borderRadius: theme.spacing(3),
    color: theme.palette.primary.contrastText,
    backgroundColor: theme.palette.primary.main,
    [theme.breakpoints.up("sm")]: {
      padding: theme.spacing(8, 6),
    },
  }
})

export function FeaturesContent() {
  return (
    <Box component="main">
      <HeroSection>
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
            <Stack
              sx={{
                mt: 2,
                gap: 2,
                flexDirection: { xs: "column", sm: "row" },
                width: { xs: "100%", sm: "auto" },
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
                variant="outlined"
                size="large"
                href={links.documentationSelfHosting}
                target="_blank"
              >
                Self host
              </Button>
            </Stack>
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
      </HeroSection>
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
        <CallToActionStack>
          <Typography variant="h4" component="h2" sx={{ fontWeight: 700 }}>
            Your library is waiting
          </Typography>
          <Typography sx={{ maxWidth: 520, opacity: 0.9 }}>
            Sign in, connect a data source and start reading in minutes. No
            installation, no credit card.
          </Typography>
          <Stack
            sx={{
              mt: 1,
              gap: 2,
              flexDirection: { xs: "column", sm: "row" },
            }}
          >
            <Button
              variant="contained"
              sx={{
                color: "primary.main",
                bgcolor: "common.white",
                "&:hover": { bgcolor: "grey.100" },
              }}
              size="large"
              href={links.app}
              target="_blank"
            >
              Start using oboku
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              size="large"
              href={links.documentation}
              target="_blank"
            >
              Read the documentation
            </Button>
          </Stack>
        </CallToActionStack>
      </Container>
    </Box>
  )
}
