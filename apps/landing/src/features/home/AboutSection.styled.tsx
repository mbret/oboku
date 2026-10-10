"use client"

import { Box, Stack, styled } from "@mui/material"
import { outlinedCardStyles } from "../common/outlinedCardStyles"

export const AboutLayoutBox = styled(Box)(function styleAboutLayoutBox({
  theme,
}) {
  return {
    display: "grid",
    gap: theme.spacing(5),
    [theme.breakpoints.up("md")]: {
      gridTemplateColumns: "7fr 5fr",
      gap: theme.spacing(8),
      alignItems: "start",
    },
  }
})

export const InfoCardStack = styled(Stack)(function styleInfoCardStack({
  theme,
}) {
  return {
    ...outlinedCardStyles(theme),
    gap: theme.spacing(1.5),
  }
})

export const ChipsStack = styled(Stack)(function styleChipsStack({ theme }) {
  return {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: theme.spacing(1),
  }
})
