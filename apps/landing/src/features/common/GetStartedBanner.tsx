import { Button, Stack, Typography } from "@mui/material"
import { links } from "@oboku/shared"
import { CallToActionStack } from "./GetStartedBanner.styled"

export function GetStartedBanner() {
  return (
    <CallToActionStack>
      <Typography variant="h4" component="h2" sx={{ fontWeight: 700 }}>
        Your library is waiting
      </Typography>
      <Typography sx={{ maxWidth: 520, opacity: 0.9 }}>
        Sign in, connect a data source and start reading in minutes. No
        installation, no credit card.
      </Typography>
      <Stack
        sx={{
          mt: 1,
          gap: 2,
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        <Button
          variant="contained"
          sx={{
            color: "primary.main",
            bgcolor: "common.white",
            "&:hover": { bgcolor: "grey.100" },
          }}
          size="large"
          href={links.app}
          target="_blank"
        >
          Start using oboku
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          size="large"
          href={links.documentation}
          target="_blank"
        >
          Read the documentation
        </Button>
      </Stack>
    </CallToActionStack>
  )
}
