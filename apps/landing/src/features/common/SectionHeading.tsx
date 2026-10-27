"use client"

import { Stack, styled, Typography } from "@mui/material"
import type { ReactNode } from "react"

const OverlineTypography = styled(Typography)(function styleOverlineTypography({
  theme,
}) {
  return {
    color: theme.vars.palette.primary.main,
    fontWeight: 700,
    letterSpacing: "0.12em",
  }
})

export function SectionHeading({
  overline,
  title,
  titleId,
  description,
}: {
  overline: string
  title: string
  titleId: string
  description?: ReactNode
}) {
  return (
    <Stack sx={{ gap: 1.5, maxWidth: 640 }}>
      <OverlineTypography variant="overline">{overline}</OverlineTypography>
      <Typography
        variant="h4"
        component="h2"
        id={titleId}
        sx={{ fontWeight: 700 }}
      >
        {title}
      </Typography>
      {description && (
        <Typography sx={{ color: "text.secondary" }}>{description}</Typography>
      )}
    </Stack>
  )
}
