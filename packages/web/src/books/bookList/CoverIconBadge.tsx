import { Box, type BoxProps } from "@mui/material"
import { type ReactNode, memo } from "react"

export const CoverIconBadge = memo(
  ({ children, ...rest }: { children: ReactNode } & BoxProps) => {
    return (
      <Box
        display="flex"
        padding={0.3}
        borderRadius="50%"
        bgcolor="white"
        border="1px solid black"
        {...rest}
      >
        {children}
      </Box>
    )
  },
)
