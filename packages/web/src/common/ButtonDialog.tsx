import { Button } from "@mui/material"
import { ComponentProps } from "react"

type Props = Omit<ComponentProps<typeof Button>, `type`> & {
  type: `confirm` | `cancel`
}

export const ButtonDialog = ({ type, ...rest }: Props) => (
  <Button {...rest} color="primary">
    {type === `confirm` ? `Confirm` : `Cancel`}
  </Button>
)
