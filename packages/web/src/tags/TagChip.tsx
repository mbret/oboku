import { ComponentProps } from "react"
import Chip from "@mui/material/Chip"
import { useTag } from "./states"
import { useDatabase } from "../rxdb"

export const TagChip = ({
  id,
  ...rest
}: { id: string } & ComponentProps<typeof Chip>) => {
  const { db$ } = useDatabase()
  const { name } = useTag(db$, id) || {}

  return <Chip label={name} {...rest} />
}
