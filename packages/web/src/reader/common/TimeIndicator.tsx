import { Typography, TypographyProps } from "@mui/material"
import { useTime } from "../../common/useTime"

export const TimeIndicator = (props: TypographyProps) => {
  const time = useTime()

  return (
    <Typography variant="caption" {...props}>
      {time.toLocaleTimeString(navigator.language, {
        hour: "2-digit",
        minute: "2-digit"
      })}
    </Typography>
  )
}
