import type React from "react"
import { Typography, useTheme } from "@mui/material"

export const OrDivider = ({
  title = "or",
  style,
}: {
  title?: string
  style?: React.CSSProperties
}) => {
  const theme = useTheme()

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        marginTop: theme.spacing(2),
        marginBottom: theme.spacing(2),
        opacity: 0.5,
        ...style,
      }}
    >
      <div
        style={{
          borderBottom: `1px solid ${theme.palette.grey[600]}`,
          height: 1,
          width: "100%",
        }}
      />
      <div
        style={{
          marginLeft: theme.spacing(2),
          marginRight: theme.spacing(2),
        }}
      >
        <Typography
          variant="body2"
          sx={{
            textTransform: "uppercase",
          }}
        >
          {title}
        </Typography>
      </div>
      <div
        style={{
          borderBottom: `1px solid ${theme.palette.grey[600]}`,
          width: "100%",
        }}
      />
    </div>
  )
}
