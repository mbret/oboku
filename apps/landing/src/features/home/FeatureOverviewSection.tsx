import { ArrowForwardRounded, AutoAwesomeRounded } from "@mui/icons-material"
import type { SvgIconComponent } from "@mui/icons-material"
import { alpha, Box, Container, Stack, styled, Typography } from "@mui/material"
import Link from "next/link"
import { BandSection } from "../common/BandSection"
import { FeatureIconBox } from "../common/FeatureIconBox"
import { outlinedCardStyles } from "../common/outlinedCardStyles"
import { SectionHeading } from "../common/SectionHeading"
import { featureGroups } from "../features/content"

const OverviewGridBox = styled(Box)(function styleOverviewGridBox({ theme }) {
  return {
    display: "grid",
    gap: theme.spacing(2.5),
    marginTop: theme.spacing(6),
    [theme.breakpoints.up("sm")]: {
      gridTemplateColumns: "1fr 1fr",
    },
    [theme.breakpoints.up("md")]: {
      gridTemplateColumns: "repeat(4, 1fr)",
    },
  }
})

const FeatureCardLink = styled(Link)(function styleFeatureCardLink({ theme }) {
  return {
    ...outlinedCardStyles(theme),
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1.5),
    color: "inherit",
    textDecoration: "none",
    transition: theme.transitions.create(
      ["border-color", "box-shadow", "transform"],
      { duration: theme.transitions.duration.shorter },
    ),
    "&:hover, &:focus-visible": {
      borderColor: theme.palette.primary.main,
      boxShadow: theme.shadows[4],
      transform: "translateY(-2px)",
    },
    "&[data-emphasized=true]": {
      borderColor: alpha(theme.palette.primary.main, 0.4),
      backgroundColor: alpha(theme.palette.primary.main, 0.06),
    },
  }
})

const CardActionStack = styled(Stack)(function styleCardActionStack({ theme }) {
  return {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(0.5),
    color: theme.palette.primary.main,
  }
})

function FeatureCard({
  href,
  Icon,
  title,
  description,
  action,
  isEmphasized,
}: {
  href: string
  Icon: SvgIconComponent
  title: string
  description: string
  action: string
  isEmphasized?: boolean
}) {
  return (
    <FeatureCardLink href={href} data-emphasized={isEmphasized}>
      <FeatureIconBox>
        <Icon fontSize="small" />
      </FeatureIconBox>
      <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {description}
      </Typography>
      <CardActionStack>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {action}
        </Typography>
        <ArrowForwardRounded fontSize="small" />
      </CardActionStack>
    </FeatureCardLink>
  )
}

export function FeatureOverviewSection() {
  return (
    <BandSection data-tinted aria-labelledby="features-title">
      <Container>
        <SectionHeading
          overline="Features"
          title="Everything you need to manage and read your library"
          titleId="features-title"
        />
        <OverviewGridBox>
          {featureGroups.map(function renderFeatureGroupCard(group) {
            return (
              <FeatureCard
                key={group.id}
                href={`/features#${group.id}`}
                Icon={group.Icon}
                title={group.overline}
                description={group.title}
                action="Learn more"
              />
            )
          })}
          <FeatureCard
            href="/features"
            Icon={AutoAwesomeRounded}
            title="All features"
            description="Every feature, section by section, with screenshots."
            action="See all features"
            isEmphasized
          />
        </OverviewGridBox>
      </Container>
    </BandSection>
  )
}
