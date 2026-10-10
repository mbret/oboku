import {
  alpha,
  Box,
  Chip,
  Container,
  Stack,
  styled,
  Typography,
} from "@mui/material"
import Image from "next/image"
import type { FeatureGroup } from "./content"

const sectionScrollMargin = 140

const BandSection = styled("section")(({ theme }) => ({
  paddingTop: theme.spacing(8),
  paddingBottom: theme.spacing(8),
  scrollMarginTop: sectionScrollMargin,
  [theme.breakpoints.up("md")]: {
    paddingTop: theme.spacing(12),
    paddingBottom: theme.spacing(12),
  },
}))

const LayoutBox = styled(Box)(({ theme }) => ({
  display: "grid",
  gap: theme.spacing(6),
  alignItems: "center",
  gridTemplateAreas: '"text" "screenshots"',
  [theme.breakpoints.up("md")]: {
    gap: theme.spacing(10),
    "&[data-layout=text-first]": {
      gridTemplateColumns: "7fr 5fr",
      gridTemplateAreas: '"text screenshots"',
    },
    "&[data-layout=screenshots-first]": {
      gridTemplateColumns: "5fr 7fr",
      gridTemplateAreas: '"screenshots text"',
    },
  },
}))

const TextStack = styled(Stack)(({ theme }) => ({
  gridArea: "text",
  gap: theme.spacing(3),
}))

const OverlineTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 700,
  letterSpacing: "0.12em",
}))

const FeatureGridBox = styled(Box)(({ theme }) => ({
  display: "grid",
  gap: theme.spacing(3),
  [theme.breakpoints.up("sm")]: {
    gridTemplateColumns: "1fr 1fr",
    columnGap: theme.spacing(4),
  },
}))

const WideFeatureGridBox = styled(FeatureGridBox)(({ theme }) => ({
  [theme.breakpoints.up("md")]: {
    gridTemplateColumns: "1fr 1fr 1fr",
  },
}))

const FeatureIconBox = styled(Box)(({ theme }) => ({
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 40,
  height: 40,
  borderRadius: theme.spacing(1.25),
  color: theme.palette.primary.main,
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
}))

const ScreenshotsBox = styled(Box)({
  gridArea: "screenshots",
  display: "flex",
  justifyContent: "center",
})

const PhonesBox = styled(Box)(({ theme }) => ({
  position: "relative",
  paddingBottom: theme.spacing(5),
  "&[data-has-secondary=true]": {
    paddingRight: 72,
    [theme.breakpoints.up("sm")]: {
      paddingRight: 100,
    },
  },
}))

const ScreenshotImage = styled(Image)(({ theme }) => ({
  display: "block",
  width: 200,
  height: "auto",
  borderRadius: theme.spacing(3),
  border: `6px solid ${theme.palette.grey[900]}`,
  boxShadow: theme.shadows[8],
  backgroundColor: theme.palette.common.white,
  [theme.breakpoints.up("sm")]: {
    width: 260,
  },
}))

const SecondaryScreenshotImage = styled(ScreenshotImage)(({ theme }) => ({
  position: "absolute",
  right: 0,
  bottom: 0,
  width: 140,
  boxShadow: theme.shadows[16],
  [theme.breakpoints.up("sm")]: {
    width: 180,
  },
}))

function FeatureList({ group }: { group: FeatureGroup }) {
  const FeatureGrid =
    group.screenshots.length > 0 ? FeatureGridBox : WideFeatureGridBox

  return (
    <FeatureGrid>
      {group.features.map(function renderFeature({ Icon, title, description }) {
        return (
          <Stack key={title} direction="row" sx={{ gap: 2 }}>
            <FeatureIconBox>
              <Icon fontSize="small" />
            </FeatureIconBox>
            <Stack sx={{ gap: 0.5 }}>
              <Typography
                variant="subtitle1"
                component="h3"
                sx={{ fontWeight: 600 }}
              >
                {title}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {description}
              </Typography>
            </Stack>
          </Stack>
        )
      })}
    </FeatureGrid>
  )
}

function Screenshots({ group }: { group: FeatureGroup }) {
  const [primaryScreenshot, secondaryScreenshot] = group.screenshots

  if (!primaryScreenshot) return null

  return (
    <ScreenshotsBox>
      <PhonesBox data-has-secondary={!!secondaryScreenshot}>
        <ScreenshotImage
          src={primaryScreenshot.src}
          alt={primaryScreenshot.alt}
          sizes="260px"
        />
        {secondaryScreenshot && (
          <SecondaryScreenshotImage
            src={secondaryScreenshot.src}
            alt={secondaryScreenshot.alt}
            sizes="180px"
          />
        )}
      </PhonesBox>
    </ScreenshotsBox>
  )
}

export function FeatureGroupSection({
  group,
  isAlternate,
}: {
  group: FeatureGroup
  isAlternate: boolean
}) {
  const hasScreenshots = group.screenshots.length > 0
  const screenshotsLayout = isAlternate ? "screenshots-first" : "text-first"
  const layout = hasScreenshots ? screenshotsLayout : "text-only"

  return (
    <BandSection
      id={group.id}
      aria-labelledby={`${group.id}-title`}
      sx={{ bgcolor: isAlternate ? "grey.50" : "background.paper" }}
    >
      <Container>
        <LayoutBox data-layout={layout}>
          <TextStack>
            <Stack sx={{ gap: 1.5, maxWidth: 640 }}>
              <OverlineTypography variant="overline">
                {group.overline}
              </OverlineTypography>
              <Typography
                variant="h4"
                component="h2"
                id={`${group.id}-title`}
                sx={{ fontWeight: 700 }}
              >
                {group.title}
              </Typography>
              <Typography sx={{ color: "text.secondary" }}>
                {group.description}
              </Typography>
            </Stack>
            {group.chips && (
              <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
                {group.chips.map(function renderChip({ label, href }) {
                  return href ? (
                    <Chip
                      key={label}
                      label={label}
                      size="small"
                      variant="outlined"
                      component="a"
                      href={href}
                      target="_blank"
                      clickable
                    />
                  ) : (
                    <Chip
                      key={label}
                      label={label}
                      size="small"
                      variant="outlined"
                    />
                  )
                })}
              </Stack>
            )}
            <Box sx={{ mt: 1 }}>
              <FeatureList group={group} />
            </Box>
          </TextStack>
          <Screenshots group={group} />
        </LayoutBox>
      </Container>
    </BandSection>
  )
}
