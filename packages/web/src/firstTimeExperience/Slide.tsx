import React, { FC } from "react"
import { useTheme } from "@material-ui/core"
import { useCSS } from "../common/utils"

export const Slide: FC<{ style?: React.CSSProperties }> = ({
  children,
  style
}) => {
  const styles = useStyles()

  return <div style={{ ...styles.slide, ...style }}>{children}</div>
}

const useStyles = () => {
  const theme = useTheme()

  return useCSS(
    () => ({
      slide: {
        // padding: theme.spacing(2),
        boxSizing: "border-box",
        textAlign: "center",
        color: "#fff",
        display: "flex",
        // flex: 1,
        flexFlow: "column",
        justifyContent: "center",
        alignItems: "center",
        width: "100%"
        // flexGrow: 0,
      }
    }),
    [theme]
  )
}
