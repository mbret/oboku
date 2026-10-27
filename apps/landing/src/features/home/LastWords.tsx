import { Container, Stack, Typography } from "@mui/material"
import { BandSection } from "../common/BandSection"
import { CommunityButtons } from "../common/CommunityButtons"
import { SectionHeading } from "../common/SectionHeading"

export function LastWords() {
  return (
    <BandSection data-tinted aria-labelledby="community-title">
      <Container>
        <Stack sx={{ gap: 3, maxWidth: 640 }}>
          <SectionHeading
            overline="One more thing"
            title="Built for readers, driven by the community"
            titleId="community-title"
          />
          <Typography sx={{ color: "text.secondary" }}>
            Oboku is under active development with new features shipping
            regularly. We prioritize what users ask for — if you love the app
            and want something, let us know. There is no better motivation than
            knowing someone will benefit from it.
          </Typography>
          <CommunityButtons />
        </Stack>
      </Container>
    </BandSection>
  )
}
