import { styled } from "@mui/material"

export const BandSection = styled("section")(function styleBandSection({
  theme,
}) {
  return {
    paddingTop: theme.spacing(8),
    paddingBottom: theme.spacing(8),
    [theme.breakpoints.up("md")]: {
      paddingTop: theme.spacing(12),
      paddingBottom: theme.spacing(12),
    },
    "&[data-tinted=true]": {
      backgroundColor: theme.alpha(
        theme.vars.palette.common.onBackground,
        0.02,
      ),
    },
  }
})
