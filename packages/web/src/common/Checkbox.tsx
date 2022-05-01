import {
  CheckCircleRounded,
  RadioButtonUncheckedOutlined
} from "@material-ui/icons"

export const Checkbox = ({ selected }: { selected: boolean }) => {
  return (
    <>{selected ? <CheckCircleRounded /> : <RadioButtonUncheckedOutlined />}</>
  )
}
