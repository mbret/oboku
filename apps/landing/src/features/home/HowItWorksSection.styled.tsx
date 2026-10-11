"use client"

import { Stack, styled, Typography } from "@mui/material"
import { FeatureIconBox } from "../common/FeatureIconBox"
import { outlinedCardStyles } from "../common/outlinedCardStyles"

export const StepsOrderedList = styled("ol")(function styleStepsOrderedList({
  theme,
}) {
  return {
    display: "grid",
    gap: theme.spacing(2.5),
    margin: theme.spacing(6, 0, 0),
    padding: 0,
    listStyle: "none",
    [theme.breakpoints.up("md")]: {
      gridTemplateColumns: "repeat(3, 1fr)",
    },
  }
})

export const StepListItem = styled("li")(function styleStepListItem({ theme }) {
  return {
    ...outlinedCardStyles(theme),
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1.5),
  }
})

export const StepNumberFeatureIconBox = styled(FeatureIconBox)(
  function styleStepNumberFeatureIconBox({ theme }) {
    return {
      ...theme.typography.subtitle1,
      fontWeight: 700,
    }
  },
)

export const StepDescriptionTypography = styled(Typography)(
  function styleStepDescriptionTypography({ theme }) {
    return {
      color: theme.vars.palette.text.secondary,
    }
  },
)

export const ChipsStack = styled(Stack)(function styleChipsStack({ theme }) {
  return {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing(1),
  }
})
