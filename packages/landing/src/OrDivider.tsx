import React, { FC } from "react"
import { Box, BoxProps, Typography } from "@mui/material"

export const OrDivider: FC<
  { title?: string; style?: React.CSSProperties } & BoxProps
> = ({ title = "or", ...rest }) => {
  return (
    <Box
      display="flex"
      alignItems="center"
      marginTop={2}
      marginBottom={2}
      width="100%"
      {...rest}
    >
      <Box
        width="100%"
        height="1px"
        style={{
          borderBottom: "1px solid black",
          opacity: "30%"
        }}
      ></Box>
      <Box marginX={2}>
        <Typography>{title}</Typography>
      </Box>
      <Box
        width="100%"
        style={{
          borderBottom: "1px solid black",
          opacity: "30%"
        }}
      ></Box>
    </Box>
  )
}
