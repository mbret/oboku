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

type ScreenshotWidths = { xs: number; sm: number }

const primaryScreenshotWidths: ScreenshotWidths = { xs: 200, sm: 260 }
const secondaryScreenshotWidths: ScreenshotWidths = { xs: 140, sm: 180 }

function toImageSizes({ xs, sm }: ScreenshotWidths) {
  return `(max-width: 599px) ${xs}px, ${sm}px`
}

const BandSection = styled("section")(function styleBandSection({ theme }) {
  return {
    paddingTop: theme.spacing(8),
    paddingBottom: theme.spacing(8),
    scrollMarginTop: sectionScrollMargin,
    [theme.breakpoints.up("md")]: {
      paddingTop: theme.spacing(12),
      paddingBottom: theme.spacing(12),
    },
  }
})

const LayoutBox = styled(Box)(function styleLayoutBox({ theme }) {
  return {
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
  }
})

const TextStack = styled(Stack)(function styleTextStack({ theme }) {
  return {
    gridArea: "text",
    gap: theme.spacing(3),
  }
})

const OverlineTypography = styled(Typography)(function styleOverlineTypography({
  theme,
}) {
  return {
    color: theme.palette.primary.main,
    fontWeight: 700,
    letterSpacing: "0.12em",
  }
})

const FeatureGridBox = styled(Box)(function styleFeatureGridBox({ theme }) {
  return {
    display: "grid",
    gap: theme.spacing(3),
    [theme.breakpoints.up("sm")]: {
      gridTemplateColumns: "1fr 1fr",
      columnGap: theme.spacing(4),
    },
  }
})

const WideFeatureGridBox = styled(FeatureGridBox)(
  function styleWideFeatureGridBox({ theme }) {
    return {
      [theme.breakpoints.up("md")]: {
        gridTemplateColumns: "1fr 1fr 1fr",
      },
    }
  },
)

const FeatureIconBox = styled(Box)(function styleFeatureIconBox({ theme }) {
  return {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: theme.spacing(1.25),
    color: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
  }
})

const ScreenshotsBox = styled(Box)({
  gridArea: "screenshots",
  display: "flex",
  justifyContent: "center",
})

const PhonesBox = styled(Box)(function stylePhonesBox({ theme }) {
  return {
    position: "relative",
    paddingBottom: theme.spacing(5),
    "&[data-has-secondary=true]": {
      paddingRight: 72,
      [theme.breakpoints.up("sm")]: {
        paddingRight: 100,
      },
    },
  }
})

const ScreenshotImage = styled(Image)(function styleScreenshotImage({ theme }) {
  return {
    display: "block",
    height: "auto",
    borderRadius: theme.spacing(3),
    border: `6px solid ${theme.palette.grey[900]}`,
    boxShadow: theme.shadows[8],
    backgroundColor: theme.palette.common.white,
    width: primaryScreenshotWidths.xs,
    [theme.breakpoints.up("sm")]: {
      width: primaryScreenshotWidths.sm,
    },
  }
})

const SecondaryScreenshotImage = styled(ScreenshotImage)(
  function styleSecondaryScreenshotImage({ theme }) {
    return {
      position: "absolute",
      right: 0,
      bottom: 0,
      width: secondaryScreenshotWidths.xs,
      boxShadow: theme.shadows[16],
      [theme.breakpoints.up("sm")]: {
        width: secondaryScreenshotWidths.sm,
      },
    }
  },
)

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
          sizes={toImageSizes(primaryScreenshotWidths)}
        />
        {secondaryScreenshot && (
          <SecondaryScreenshotImage
            src={secondaryScreenshot.src}
            alt={secondaryScreenshot.alt}
            sizes={toImageSizes(secondaryScreenshotWidths)}
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
