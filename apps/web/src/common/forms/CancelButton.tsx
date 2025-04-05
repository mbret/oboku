import { Button } from "@mui/material"
import type { ComponentProps } from "react"

export const CancelButton = (props: ComponentProps<typeof Button>) => {
  return (
    <Button variant="outlined" {...props}>
      Cancel
    </Button>
  )
}
