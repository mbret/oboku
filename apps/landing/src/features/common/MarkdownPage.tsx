import { Container, Stack } from "@mui/material"
import { Markdown } from "./Markdown"

export function MarkdownPage({ content }: { content: string }) {
  return (
    <Container maxWidth="md">
      <Stack
        sx={{
          pt: 12,
        }}
      >
        <Markdown>{content}</Markdown>
      </Stack>
    </Container>
  )
}
