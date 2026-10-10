import { styled } from "@mui/material"

export const GlowHeroSection = styled("section")(function styleGlowHeroSection({
  theme,
}) {
  return {
    paddingTop: theme.spacing(14),
    paddingBottom: theme.spacing(6),
    background: `radial-gradient(ellipse at top, ${theme.alpha(theme.vars.palette.primary.main, 0.12)}, transparent 70%)`,
    [theme.breakpoints.up("sm")]: {
      paddingTop: theme.spacing(18),
      paddingBottom: theme.spacing(8),
    },
  }
})
