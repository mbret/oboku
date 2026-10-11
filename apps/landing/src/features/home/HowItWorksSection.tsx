import { AddRounded } from "@mui/icons-material"
import { Chip, Container, Typography } from "@mui/material"
import { BandSection } from "../common/BandSection"
import { NextLink } from "../common/NextLink"
import { SectionHeading } from "../common/SectionHeading"
import { syncProviders } from "./content"
import {
  ChipsStack,
  StepDescriptionTypography,
  StepListItem,
  StepNumberFeatureIconBox,
  StepsOrderedList,
} from "./HowItWorksSection.styled"

type Step = {
  title: string
  description: string
  chips?: { label: string; href: string }[]
  moreChipHref?: string
}

const steps: Step[] = [
  {
    title: "Connect where your books already live",
    description:
      "Link folders from your cloud drive, NAS or WebDAV server, or add files from your device. Sharing a folder shares its books: friends who connect it get a library of their own.",
    chips: syncProviders,
    moreChipHref: "/features#sources",
  },
  {
    title: "oboku builds your library",
    description:
      "Your books are organized for you, with their covers and metadata retrieved automatically. Book files are never stored on oboku's servers: each one is downloaded from its source when you open it.",
  },
  {
    title: "Read anywhere, even offline",
    description:
      "Open oboku in any modern browser, or install it like an app on your phone, tablet or computer. Downloaded books open offline, e-ink mode suits e-ink screens, and your progress syncs across devices.",
  },
]

export function HowItWorksSection() {
  return (
    <BandSection aria-labelledby="how-it-works-title">
      <Container>
        <SectionHeading
          overline="How it works"
          title="Read your books without moving them"
          titleId="how-it-works-title"
          description="oboku is a free, open-source ebook and comic reader that syncs your library from the cloud drive or server you already use."
        />
        <StepsOrderedList>
          {steps.map(function renderStep(
            { title, description, chips, moreChipHref },
            index,
          ) {
            return (
              <StepListItem key={title}>
                <StepNumberFeatureIconBox>{index + 1}</StepNumberFeatureIconBox>
                <Typography variant="h6" component="h3">
                  {title}
                </Typography>
                <StepDescriptionTypography variant="body2">
                  {description}
                </StepDescriptionTypography>
                {chips && (
                  <ChipsStack>
                    {chips.map(function renderChip({ label, href }) {
                      return (
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
                      )
                    })}
                    {moreChipHref && (
                      <Chip
                        icon={<AddRounded />}
                        label="More"
                        size="small"
                        variant="outlined"
                        component={NextLink}
                        href={moreChipHref}
                        clickable
                      />
                    )}
                  </ChipsStack>
                )}
              </StepListItem>
            )
          })}
        </StepsOrderedList>
      </Container>
    </BandSection>
  )
}
