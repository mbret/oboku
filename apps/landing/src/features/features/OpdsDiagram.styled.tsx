"use client"

import { ArrowForwardRounded } from "@mui/icons-material"
import { Box, Stack, styled } from "@mui/material"
import { outlinedCardStyles } from "../common/outlinedCardStyles"

export const DiagramFigure = styled("figure")({
  margin: "0 auto",
  maxWidth: 480,
})

export const DiagramGridBox = styled(Box)(function styleDiagramGridBox({
  theme,
}) {
  return {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr auto 1fr",
    alignItems: "center",
    columnGap: theme.spacing(0.5),
    [theme.breakpoints.up("sm")]: {
      columnGap: theme.spacing(1),
    },
  }
})

export const NodeColumnStack = styled(Stack)(function styleNodeColumnStack({
  theme,
}) {
  return {
    gap: theme.spacing(1.5),
  }
})

export const NodeStack = styled(Stack)(function styleNodeStack({ theme }) {
  return {
    ...outlinedCardStyles(theme),
    alignItems: "center",
    gap: theme.spacing(0.75),
    padding: theme.spacing(1.5, 1),
    textAlign: "center",
  }
})

export const ObokuNodeStack = styled(NodeStack)(function styleObokuNodeStack({
  theme,
}) {
  return {
    paddingTop: theme.spacing(2.5),
    paddingBottom: theme.spacing(2.5),
    borderColor: theme.vars.palette.primary.main,
    boxShadow: `0 0 24px ${theme.alpha(theme.vars.palette.primary.main, 0.25)}`,
  }
})

export const FlowArrowIcon = styled(ArrowForwardRounded)(
  function styleFlowArrowIcon({ theme }) {
    return {
      color: theme.vars.palette.text.secondary,
    }
  },
)
