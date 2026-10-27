import { Button, Stack, Typography } from "@mui/material"
import { links } from "@oboku/shared"
import { CallToActionStack, InvertedButton } from "./GetStartedBanner.styled"

export function GetStartedBanner() {
  return (
    <CallToActionStack>
      <Typography variant="h4" component="h2" sx={{ fontWeight: 700 }}>
        Your library is waiting
      </Typography>
      <Typography sx={{ maxWidth: 520 }}>
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
        <InvertedButton variant="contained" size="large" href={links.app}>
          Start using oboku
        </InvertedButton>
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
