"use client"

import { Container, Stack } from "@mui/material"
import { Markdown } from "../../features/common/Markdown"

export function PageContent({ content }: { content: string }) {
  return (
    <Container maxWidth="md">
      <Stack pt={12}>
        <Markdown>{content}</Markdown>
      </Stack>
    </Container>
  )
}
