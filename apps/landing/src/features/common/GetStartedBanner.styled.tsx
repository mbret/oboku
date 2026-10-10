"use client"

import { Stack, styled } from "@mui/material"

export const CallToActionStack = styled(Stack)(function styleCallToActionStack({
  theme,
}) {
  return {
    alignItems: "center",
    textAlign: "center",
    gap: theme.spacing(2),
    padding: theme.spacing(6, 3),
    borderRadius: theme.spacing(3),
    color: theme.palette.primary.contrastText,
    backgroundColor: theme.palette.primary.main,
    [theme.breakpoints.up("sm")]: {
      padding: theme.spacing(8, 6),
    },
  }
})
