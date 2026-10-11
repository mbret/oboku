import { AddRounded } from "@mui/icons-material"
import { Chip, Container, Stack, styled, Typography } from "@mui/material"
import Link from "next/link"
import { BandSection } from "../common/BandSection"
import { FeatureIconBox } from "../common/FeatureIconBox"
import { outlinedCardStyles } from "../common/outlinedCardStyles"
import { SectionHeading } from "../common/SectionHeading"
import { syncProviders } from "./content"

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
      "Folders become collections, and books get their covers and details from the files or online sources. Book files are never stored on oboku's servers: each one is downloaded from its source when you open it.",
  },
  {
    title: "Read anywhere, even offline",
    description:
      "Open oboku in any modern browser, or install it like an app on your phone, tablet or computer. Downloaded books open offline, e-ink mode suits e-ink screens, and your progress syncs across devices.",
  },
]

const StepsOrderedList = styled("ol")(function styleStepsOrderedList({
  theme,
}) {
  return {
    display: "grid",
    gap: theme.spacing(2.5),
    margin: theme.spacing(6, 0, 0),
    padding: 0,
    listStyle: "none",
    [theme.breakpoints.up("md")]: {
      gridTemplateColumns: "repeat(3, 1fr)",
    },
  }
})

const StepListItem = styled("li")(function styleStepListItem({ theme }) {
  return {
    ...outlinedCardStyles(theme),
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1.5),
  }
})

const StepNumberFeatureIconBox = styled(FeatureIconBox)(
  function styleStepNumberFeatureIconBox({ theme }) {
    return {
      ...theme.typography.subtitle1,
      fontWeight: 700,
    }
  },
)

const StepDescriptionTypography = styled(Typography)(
  function styleStepDescriptionTypography({ theme }) {
    return {
      color: theme.vars.palette.text.secondary,
    }
  },
)

const ChipsStack = styled(Stack)(function styleChipsStack({ theme }) {
  return {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing(1),
  }
})

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
                        component={Link}
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
