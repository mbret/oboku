"use client"

import { Box, Stack, styled } from "@mui/material"

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

export const NodesStack = styled(Stack)(function styleNodesStack({ theme }) {
  return {
    gap: theme.spacing(1.5),
  }
})

export const NodeStack = styled(Stack)(function styleNodeStack({ theme }) {
  return {
    alignItems: "center",
    gap: theme.spacing(0.75),
    padding: theme.spacing(1.5, 1),
    textAlign: "center",
    borderRadius: theme.spacing(1.5),
    border: `1px solid ${theme.vars.palette.divider}`,
    backgroundColor: theme.vars.palette.background.paper,
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

export const ArrowStack = styled(Stack)(function styleArrowStack({ theme }) {
  return {
    alignItems: "center",
    color: theme.vars.palette.text.secondary,
  }
})
