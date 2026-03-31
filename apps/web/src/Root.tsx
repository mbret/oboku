import type { ReactNode } from "react"
import { Box, type BoxProps } from "@mui/material"

export const Root = ({
  children,
  ...props
}: { children: ReactNode } & BoxProps) => (
  <Box height="100%" {...props}>
    {children}
  </Box>
)
