import { alpha, Box, styled } from "@mui/material"

export const FeatureIconBox = styled(Box)(function styleFeatureIconBox({
  theme,
}) {
  return {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: theme.spacing(1.25),
    color: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
  }
})
