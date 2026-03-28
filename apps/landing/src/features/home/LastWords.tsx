import { Chip, Container, Stack, Typography } from "@mui/material"

export const LastWords = () => {
  return (
    <Container>
      <Stack gap={2}>
        <Chip
          label="One more thing"
          sx={{
            alignSelf: "flex-start",
          }}
        />
        <Typography variant="h4" component="h2">
          Built for readers, driven by the community
        </Typography>
        <Typography>
          Oboku is under active development with new features shipping
          regularly. We prioritize what users ask for — if you love the app and
          want something, let us know. There is no better motivation than
          knowing someone will benefit from it.
        </Typography>
        <Typography>
          The project is free, open source, and ad-free — and we intend to keep
          it that way. Donations and sponsorship will be available to help
          sustain the project. The cloud version will stay online for as long as
          we can cover the infrastructure costs.
        </Typography>
      </Stack>
    </Container>
  )
}
