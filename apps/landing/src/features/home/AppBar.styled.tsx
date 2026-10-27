"use client"

import { styled } from "@mui/material"
import Link from "next/link"

export const LogoLink = styled(Link)(function styleLogoLink({ theme }) {
  return {
    ...theme.typography.h6,
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    flexGrow: 1,
    color: "inherit",
    textDecoration: "none",
  }
})
