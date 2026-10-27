import { Button, Stack } from "@mui/material"
import { links } from "@oboku/shared"

export function GetStartedActions() {
  return (
    <Stack
      sx={{
        pt: 2,
        gap: 2,
        flexDirection: { xs: "column", sm: "row" },
        width: { xs: "100%", sm: "auto" },
      }}
    >
      <Button variant="contained" size="large" href={links.app}>
        Start using oboku
      </Button>
      <Button
        variant="outlined"
        size="large"
        href={links.documentationSelfHosting}
        target="_blank"
      >
        Self host
      </Button>
    </Stack>
  )
}
