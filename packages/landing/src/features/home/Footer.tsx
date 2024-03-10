"use client"

import { Box, Container, Link, Stack, Typography } from "@mui/material"
import { links } from "@oboku/shared"

export const Footer = () => {
  return (
    <Box py={[8, 12]}>
      <Container
        maxWidth="sm"
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 8
        }}
      >
        <Stack flexDirection="row" gap={8}>
          <Stack gap={1}>
            <Typography variant="body1" fontWeight={500}>
              Resources
            </Typography>
            <Stack gap={0}>
              <Link
                href={links.app}
                target="_blank"
                variant="body2"
                underline="hover"
              >
                App
              </Link>
              <Link
                href={links.documentation}
                target="_blank"
                variant="body2"
                underline="hover"
              >
                Documentation
              </Link>
              <Link
                href={links.github}
                target="_blank"
                variant="body2"
                underline="hover"
              >
                Github
              </Link>
            </Stack>
          </Stack>
          <Stack gap={1}>
            <Typography variant="body1" fontWeight={500}>
              Socials
            </Typography>
            <Stack gap={0}>
              <Link
                href={links.discord}
                target="_blank"
                variant="body2"
                underline="hover"
              >
                Discord
              </Link>
              <Link
                href={links.reddit}
                target="_blank"
                variant="body2"
                underline="hover"
              >
                Reddit
              </Link>
            </Stack>
          </Stack>
        </Stack>
        <Stack alignItems="center">
          <Typography>
            © Copyright{" "}
            <Link
              color="primary"
              href={links.linkedin}
              rel="nofollow noopener noreferrer"
              target="_blank"
              underline="hover"
            >
              Maxime Bret
            </Link>
            .
          </Typography>
        </Stack>
      </Container>
    </Box>
  )
}
