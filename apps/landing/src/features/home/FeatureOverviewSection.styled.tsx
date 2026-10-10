"use client"

import { alpha, Box, Stack, styled } from "@mui/material"
import Link from "next/link"
import { outlinedCardStyles } from "../common/outlinedCardStyles"

export const OverviewGridBox = styled(Box)(function styleOverviewGridBox({
  theme,
}) {
  return {
    display: "grid",
    gap: theme.spacing(2.5),
    marginTop: theme.spacing(6),
    [theme.breakpoints.up("sm")]: {
      gridTemplateColumns: "1fr 1fr",
    },
    [theme.breakpoints.up("md")]: {
      gridTemplateColumns: "repeat(3, 1fr)",
    },
  }
})

export const FeatureCardLink = styled(Link)(function styleFeatureCardLink({
  theme,
}) {
  return {
    ...outlinedCardStyles(theme),
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1.5),
    color: "inherit",
    textDecoration: "none",
    transition: theme.transitions.create(
      ["border-color", "box-shadow", "transform"],
      { duration: theme.transitions.duration.shorter },
    ),
    "&:hover, &:focus-visible": {
      borderColor: theme.palette.primary.main,
      boxShadow: theme.shadows[4],
      transform: "translateY(-2px)",
    },
    "&[data-emphasized=true]": {
      borderColor: alpha(theme.palette.primary.main, 0.4),
      backgroundColor: alpha(theme.palette.primary.main, 0.06),
      [theme.breakpoints.only("sm")]: {
        gridColumn: "1 / -1",
      },
    },
  }
})

export const CardActionStack = styled(Stack)(function styleCardActionStack({
  theme,
}) {
  return {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(0.5),
    color: theme.palette.primary.main,
  }
})
