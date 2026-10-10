"use client"

import { alpha, Box, Stack, styled } from "@mui/material"
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

export const SectionNav = styled("nav")(function styleSectionNav({ theme }) {
  return {
    position: "sticky",
    top: 56,
    zIndex: theme.zIndex.appBar - 1,
    backgroundColor: alpha(theme.palette.background.paper, 0.9),
    backdropFilter: "blur(8px)",
    borderTop: `1px solid ${theme.palette.divider}`,
    borderBottom: `1px solid ${theme.palette.divider}`,
    [theme.breakpoints.up("sm")]: {
      top: 64,
    },
  }
})

export const SectionNavStack = styled(Stack)(function styleSectionNavStack({
  theme,
}) {
  return {
    flexDirection: "row",
    gap: theme.spacing(1),
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    overflowX: "auto",
    scrollbarWidth: "none",
    [theme.breakpoints.up("md")]: {
      justifyContent: "center",
    },
  }
})
