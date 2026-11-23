"use client"

import { Box, Stack, styled } from "@mui/material"
import { BandSection } from "../common/BandSection"

const sectionScrollMargin = 140

export const FeatureGroupBandSection = styled(BandSection)({
  scrollMarginTop: sectionScrollMargin,
})

export const LayoutBox = styled(Box)(function styleLayoutBox({ theme }) {
  return {
    display: "grid",
    gap: theme.spacing(6),
    alignItems: "center",
    gridTemplateAreas: '"text" "illustration"',
    "&[data-layout=text-only]": {
      gridTemplateAreas: '"text"',
    },
    [theme.breakpoints.up("md")]: {
      gap: theme.spacing(10),
      "&[data-layout=text-first]": {
        gridTemplateColumns: "7fr 5fr",
        gridTemplateAreas: '"text illustration"',
      },
      "&[data-layout=illustration-first]": {
        gridTemplateColumns: "5fr 7fr",
        gridTemplateAreas: '"illustration text"',
      },
    },
  }
})

export const TextStack = styled(Stack)(function styleTextStack({ theme }) {
  return {
    gridArea: "text",
    gap: theme.spacing(3),
  }
})

export const IllustrationAreaBox = styled(Box)({
  gridArea: "illustration",
})

export const FeatureGridBox = styled(Box)(function styleFeatureGridBox({
  theme,
}) {
  return {
    display: "grid",
    gap: theme.spacing(3),
    [theme.breakpoints.up("sm")]: {
      gridTemplateColumns: "1fr 1fr",
      columnGap: theme.spacing(4),
    },
    [theme.breakpoints.between("md", "lg")]: {
      gridTemplateColumns: "1fr",
    },
  }
})

export const WideFeatureGridBox = styled(FeatureGridBox)(
  function styleWideFeatureGridBox({ theme }) {
    return {
      [theme.breakpoints.up("md")]: {
        gridTemplateColumns: "1fr 1fr 1fr",
      },
    }
  },
)
