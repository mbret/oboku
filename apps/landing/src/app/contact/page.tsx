import { Button, Container, Link, Stack, Typography } from "@mui/material"
import { links } from "@oboku/shared"
import { GitHub } from "@mui/icons-material"
import { CommunityButtons } from "../../features/common/CommunityButtons"

export default async function Page() {
  return (
    <Container maxWidth="md">
      <Stack
        sx={{
          pt: 12,
          gap: 2,
          minHeight: "50vh",
        }}
      >
        <Typography variant="h4" component="h1">
          Contact
        </Typography>
        <Typography>You can contact us on the following platforms:</Typography>
        <CommunityButtons />
        <Typography
          variant="h6"
          component="h2"
          sx={{
            mt: 2,
          }}
        >
          Technical issue
        </Typography>
        <Typography>
          If you have a technical issue you can open an issue on the repository
        </Typography>
        <Button
          component={Link}
          sx={{ alignSelf: "flex-start" }}
          href={links.github}
          startIcon={<GitHub />}
          variant="outlined"
        >
          Github
        </Button>
      </Stack>
    </Container>
  )
}
