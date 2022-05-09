import {
  CheckCircleRounded,
  RadioButtonUncheckedOutlined
} from "@mui/icons-material"

export const Checkbox = ({ selected }: { selected: boolean }) => {
  return (
    <>{selected ? <CheckCircleRounded /> : <RadioButtonUncheckedOutlined />}</>
  )
}
