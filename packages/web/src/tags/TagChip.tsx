import { ComponentProps } from "react"
import Chip from "@mui/material/Chip"
import { useTag } from "./states"

export const TagChip = ({
  id,
  ...rest
}: { id: string } & ComponentProps<typeof Chip>) => {
  const { name } = useTag(id) || {}

  return <Chip label={name} {...rest} />
}
