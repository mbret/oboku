"use client"

import {
  Box,
  Container,
  Link as MuiLink,
  Stack,
  Typography
} from "@mui/material"
import { links } from "@oboku/shared"
import Link from "next/link"

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
        <Stack
          display="grid"
          gap={2}
          gridTemplateColumns={["1fr", "1fr 1fr 1fr"]}
        >
          <Stack gap={1}>
            <Typography variant="body1" fontWeight={500}>
              Resources
            </Typography>
            <Stack gap={0}>
              <MuiLink
                href={links.app}
                target="_blank"
                variant="body2"
                underline="hover"
              >
                App
              </MuiLink>
              <MuiLink
                href={links.documentation}
                target="_blank"
                variant="body2"
                underline="hover"
              >
                Documentation
              </MuiLink>
              <MuiLink href="/contact" variant="body2" underline="hover">
                Contact
              </MuiLink>
              <MuiLink
                href={links.github}
                target="_blank"
                variant="body2"
                underline="hover"
              >
                Github
              </MuiLink>
            </Stack>
          </Stack>
          <Stack gap={1}>
            <Typography variant="body1" fontWeight={500}>
              Socials
            </Typography>
            <Stack gap={0}>
              <MuiLink
                href={links.discord}
                target="_blank"
                variant="body2"
                underline="hover"
              >
                Discord
              </MuiLink>
              <MuiLink
                href={links.reddit}
                target="_blank"
                variant="body2"
                underline="hover"
              >
                Reddit
              </MuiLink>
            </Stack>
          </Stack>
          <Stack gap={1}>
            <Typography variant="body1" fontWeight={500}>
              Legal
            </Typography>
            <Stack gap={0}>
              <MuiLink
                component={Link}
                href="/privacy-policy"
                variant="body2"
                underline="hover"
              >
                Privacy Policy
              </MuiLink>
            </Stack>
          </Stack>
        </Stack>
        <Stack alignItems="center">
          <Typography>
            © Copyright{" "}
            <MuiLink
              color="primary"
              href={links.linkedin}
              rel="nofollow noopener noreferrer"
              target="_blank"
              underline="hover"
            >
              Maxime Bret
            </MuiLink>
            .
          </Typography>
        </Stack>
      </Container>
    </Box>
  )
}
