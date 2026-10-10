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
    color: theme.vars.palette.primary.contrastText,
    backgroundColor: theme.vars.palette.primary.main,
    [theme.breakpoints.up("sm")]: {
      padding: theme.spacing(8, 6),
    },
  }
})

// Cast preserves Button's `href` overload (an anchor accepting `target`),
// which MUI's `styled` otherwise erases.
const InvertedButton = styled(Button)(function styleInvertedButton({ theme }) {
  const hoverOverlay = theme.vars.palette.action.hover

  return {
    color: theme.vars.palette.primary.main,
    backgroundColor: theme.vars.palette.primary.contrastText,
    "&:hover": {
      backgroundImage: `linear-gradient(${hoverOverlay}, ${hoverOverlay})`,
    },
  }
}) as typeof Button

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
        <InvertedButton
          variant="contained"
          size="large"
          href={links.app}
        >
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
