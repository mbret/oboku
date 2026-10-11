import { ArrowForwardRounded, AutoAwesomeRounded } from "@mui/icons-material"
import type { SvgIconComponent } from "@mui/icons-material"
import { Container, Typography } from "@mui/material"
import { BandSection } from "../common/BandSection"
import { FeatureIconBox } from "../common/FeatureIconBox"
import { SectionHeading } from "../common/SectionHeading"
import { featureGroups } from "../features/content"
import {
  CardActionStack,
  FeatureCardLink,
  OverviewGridBox,
} from "./FeatureOverviewSection.styled"

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
