import { useTheme } from "@mui/material"
import { FC } from "react"

export const HeroCover: FC<{ src: string; style?: React.CSSProperties }> = ({
  src,
  style
}) => {
  const theme = useTheme()

  return (
    <div
      style={{
        // height: '100%',
        // width: '100%',
        // minWidth: 0,
        // maxHeight: '100%',
        // flexGrow: 1,
        minHeight: 0, // useful for webkit
        height: "100%", // useful for webkit
        ...style
      }}
    >
      <img
        src={src}
        alt="cover"
        style={{
          // maxWidth: '100%',
          objectFit: "contain",
          // maxHeight: '100%',
          maxWidth: theme.custom.maxWidthCenteredContent,
          height: "100%",
          width: "100%"
        }}
      />
    </div>
  )
}
