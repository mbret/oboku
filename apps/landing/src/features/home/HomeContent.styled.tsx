"use client"

import { Box, Stack, styled } from "@mui/material"

export const HeroLayoutBox = styled(Box)(function styleHeroLayoutBox({
  theme,
}) {
  return {
    display: "grid",
    gap: theme.spacing(6),
    alignItems: "center",
    [theme.breakpoints.up("md")]: {
      gridTemplateColumns: "7fr 5fr",
      gap: theme.spacing(8),
    },
  }
})

export const HeroTextStack = styled(Stack)(function styleHeroTextStack({
  theme,
}) {
  return {
    gap: theme.spacing(2),
    alignItems: "center",
    textAlign: "center",
    [theme.breakpoints.up("md")]: {
      alignItems: "flex-start",
      textAlign: "left",
    },
  }
})
