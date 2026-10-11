import { Box, Chip, Container, Stack, Typography } from "@mui/material"
import { FeatureIconBox } from "../common/FeatureIconBox"
import { PhoneScreenshots } from "../common/PhoneScreenshots"
import { SectionHeading } from "../common/SectionHeading"
import type { FeatureGroup } from "./content"
import {
  FeatureGridBox,
  FeatureGroupBandSection,
  LayoutBox,
  ScreenshotsAreaBox,
  TextStack,
  WideFeatureGridBox,
} from "./FeatureGroupSection.styled"

function FeatureList({ group }: { group: FeatureGroup }) {
  const FeatureGrid = group.screenshots ? FeatureGridBox : WideFeatureGridBox

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

export function FeatureGroupSection({
  group,
  isAlternate,
}: {
  group: FeatureGroup
  isAlternate: boolean
}) {
  const screenshotsLayout = isAlternate ? "screenshots-first" : "text-first"
  const layout = group.screenshots ? screenshotsLayout : "text-only"
  const titleId = `${group.id}-title`

  return (
    <FeatureGroupBandSection
      id={group.id}
      aria-labelledby={titleId}
      data-tinted={isAlternate}
    >
      <Container>
        <LayoutBox data-layout={layout}>
          <TextStack>
            <SectionHeading
              overline={group.overline}
              title={group.title}
              titleId={titleId}
              description={group.description}
            />
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
          {group.screenshots && (
            <ScreenshotsAreaBox>
              <PhoneScreenshots {...group.screenshots} />
            </ScreenshotsAreaBox>
          )}
        </LayoutBox>
      </Container>
    </FeatureGroupBandSection>
  )
}
