import { Reddit } from "@mui/icons-material"
import { Button, Link, Stack } from "@mui/material"
import { links } from "@oboku/shared"
import { DiscordMarkBlueIcon } from "./DiscordMarkBlueIcon"

export function CommunityButtons() {
  return (
    <Stack
      sx={{
        flexDirection: "row",
        gap: 2,
      }}
    >
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
  )
}
