import type { ComponentProps } from "react"
import Chip from "@mui/material/Chip"
import { useTag } from "./helpers"

export const TagChip = ({
  id,
  ...rest
}: { id: string } & ComponentProps<typeof Chip>) => {
  const { data: tag } = useTag(id)

  return <Chip label={tag?.name} {...rest} />
}
