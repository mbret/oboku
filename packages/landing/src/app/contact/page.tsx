import { Button, Container, Link, Stack, Typography } from "@mui/material"
import { links } from "@oboku/shared"
import { DiscordMarkBlueIcon } from "../../features/home/DiscordMarkBlueIcon"
import { GitHub, Reddit } from "@mui/icons-material"

export default async function Page() {
  return (
    <Container maxWidth="md">
      <Stack pt={12} gap={2} minHeight="50vh">
        <Typography variant="h4" component="h1">
          Contact
        </Typography>
        <Typography>You can contact us on the following platforms:</Typography>
        <Stack flexDirection="row" gap={2}>
          <Button
            component={Link}
            href={links.discord}
            startIcon={<DiscordMarkBlueIcon />}
            variant="outlined"
          >
            Discord
          </Button>
          <Button
            component={Link}
            href={links.reddit}
            startIcon={<Reddit />}
            variant="outlined"
          >
            Reddit
          </Button>
        </Stack>
        <Typography variant="h6" component="h2" mt={2}>
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
