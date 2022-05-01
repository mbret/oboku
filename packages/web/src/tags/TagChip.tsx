import { ComponentProps } from "react"
import Chip from "@material-ui/core/Chip"
import { useRecoilValue } from "recoil"
import { tagState } from "./states"

export const TagChip = ({
  id,
  ...rest
}: { id: string } & ComponentProps<typeof Chip>) => {
  const { name } = useRecoilValue(tagState(id)) || {}

  return <Chip label={name} {...rest} />
}
