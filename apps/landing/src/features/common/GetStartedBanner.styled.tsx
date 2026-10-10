"use client"

import { Button, Stack, styled } from "@mui/material"

export const CallToActionStack = styled(Stack)(function styleCallToActionStack({
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
export const InvertedButton = styled(Button)(function styleInvertedButton({
  theme,
}) {
  const hoverOverlay = theme.vars.palette.action.hover

  return {
    color: theme.vars.palette.primary.main,
    backgroundColor: theme.vars.palette.primary.contrastText,
    "&:hover": {
      color: theme.vars.palette.primary.dark,
      backgroundImage: `linear-gradient(${hoverOverlay}, ${hoverOverlay})`,
    },
  }
}) as typeof Button
