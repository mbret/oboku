import { Chip, Container, Link, Stack, Typography } from "@mui/material"
import { links } from "@oboku/shared"
import { BandSection } from "../common/BandSection"
import { SectionHeading } from "../common/SectionHeading"
import {
  AboutLayoutBox,
  ChipsStack,
  InfoCardStack,
} from "./AboutSection.styled"
import { supportedExtensions, syncProviders } from "./content"

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
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Want to share your library? Simply share your drive and your
                friends will be able to build their own library just as easily.
              </Typography>
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
