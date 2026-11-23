"use client"

import { Box, Stack, styled } from "@mui/material"
import { outlinedCardStyles } from "../common/outlinedCardStyles"

export const HighlightsBox = styled(Box)(function styleHighlightsBox({
  theme,
}) {
  return {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: theme.spacing(2),
    marginTop: theme.spacing(6),
    [theme.breakpoints.up("md")]: {
      gridTemplateColumns: "repeat(4, 1fr)",
    },
  }
})

export const HighlightStack = styled(Stack)(function styleHighlightStack({
  theme,
}) {
  return {
    ...outlinedCardStyles(theme),
    gap: theme.spacing(0.5),
    padding: theme.spacing(2.5),
    textAlign: "center",
  }
})
