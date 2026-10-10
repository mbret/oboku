import { Button, Stack, styled, Typography } from "@mui/material"
import { links } from "@oboku/shared"

const CallToActionStack = styled(Stack)(function styleCallToActionStack({
  theme,
}) {
  return {
    alignItems: "center",
    textAlign: "center",
    gap: theme.spacing(2),
    padding: theme.spacing(6, 3),
    borderRadius: theme.spacing(3),
    color: theme.palette.primary.contrastText,
    backgroundColor: theme.palette.primary.main,
    [theme.breakpoints.up("sm")]: {
      padding: theme.spacing(8, 6),
    },
  }
})

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
