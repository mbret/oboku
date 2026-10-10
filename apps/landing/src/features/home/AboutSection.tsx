import {
  Box,
  Chip,
  Container,
  Link,
  Stack,
  styled,
  Typography,
} from "@mui/material"
import { links } from "@oboku/shared"
import { BandSection } from "../common/BandSection"
import { outlinedCardStyles } from "../common/outlinedCardStyles"
import { SectionHeading } from "../common/SectionHeading"
import { supportedExtensions, syncProviders } from "./content"

const AboutLayoutBox = styled(Box)(function styleAboutLayoutBox({ theme }) {
  return {
    display: "grid",
    gap: theme.spacing(5),
    [theme.breakpoints.up("md")]: {
      gridTemplateColumns: "7fr 5fr",
      gap: theme.spacing(8),
      alignItems: "start",
    },
  }
})

const InfoCardStack = styled(Stack)(function styleInfoCardStack({ theme }) {
  return {
    ...outlinedCardStyles(theme),
    gap: theme.spacing(1.5),
  }
})

const ChipsStack = styled(Stack)(function styleChipsStack({ theme }) {
  return {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: theme.spacing(1),
  }
})

export function AboutSection() {
  return (
    <BandSection aria-labelledby="about-title">
      <Container>
        <AboutLayoutBox>
          <SectionHeading
            overline="About"
            title="What is oboku?"
            titleId="about-title"
            description="Oboku is a free and open-source ebook and comic reader that runs in your web browser. Instead of uploading your books to yet another service, you connect the places where they already live and oboku builds your library from them, on every device. Use the cloud version, or self-host it to keep everything under your control."
          />
          <Stack sx={{ gap: 2.5 }}>
            <InfoCardStack>
              <Typography variant="h6" component="h3">
                Synchronize from anywhere
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Access and synchronize your library from your own server, your
                device, or external providers.
              </Typography>
              <ChipsStack>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Examples:
                </Typography>
                {syncProviders.map(function renderSyncProviderChip({
                  label,
                  docsPath,
                }) {
                  return (
                    <Chip
                      key={label}
                      label={label}
                      size="small"
                      variant="outlined"
                      component="a"
                      href={`${links.documentation}/${docsPath}`}
                      target="_blank"
                      clickable
                    />
                  )
                })}
              </ChipsStack>
            </InfoCardStack>
            <InfoCardStack>
              <Typography variant="h6" component="h3">
                Supported formats
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Read ebooks, audiobooks, comics and various types of documents
                in one place.
              </Typography>
              <ChipsStack>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Examples:
                </Typography>
                {supportedExtensions.map(
                  function renderSupportedExtensionChip(extension) {
                    return (
                      <Chip
                        key={extension}
                        label={extension}
                        size="small"
                        variant="outlined"
                      />
                    )
                  },
                )}
              </ChipsStack>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Oboku uses{" "}
                <Link
                  href="https://prose-reader.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Prose
                </Link>{" "}
                under the hood for its reader.
              </Typography>
            </InfoCardStack>
          </Stack>
        </AboutLayoutBox>
      </Container>
    </BandSection>
  )
}
