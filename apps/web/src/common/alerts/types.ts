import type { AlertProps } from "@mui/material"
import type { ReactNode } from "react"

export type types = Omit<AlertProps, "severity"> & {
  subject?: string
  children?: ReactNode
}
