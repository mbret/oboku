"use client"

import { styled } from "@mui/material"

export const GlowHeroSection = styled("section")(function styleGlowHeroSection({
  theme,
}) {
  return {
    paddingTop: theme.spacing(14),
    paddingBottom: theme.spacing(6),
    // Any stronger and the hero's outlined button text drops below WCAG AA in
    // light mode on mobile, which Lighthouse cannot measure over a gradient.
    background: `radial-gradient(ellipse at top, ${theme.alpha(theme.vars.palette.primary.main, 0.08)}, transparent 70%)`,
    [theme.breakpoints.up("sm")]: {
      paddingTop: theme.spacing(18),
      paddingBottom: theme.spacing(8),
    },
  }
})
