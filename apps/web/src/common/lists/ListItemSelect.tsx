import {
  ListItem,
  ListItemButton,
  ListItemText,
  type ListItemTextProps,
} from "@mui/material"
import { useState } from "react"
import { MultipleChoiceDrawer } from "../MultipleChoiceDrawer"

/**
 * A list item that opens a bottom drawer to pick one value among `choices`,
 * displaying the selected choice's label as its secondary text.
 *
 * The select counterpart of `ListItemSwitch`.
 */
export const ListItemSelect = <Value extends string>({
  primary,
  value,
  choices,
  onChange,
}: {
  value: Value
  choices: { value: Value; label: string }[]
  onChange: (value: Value) => void
} & Pick<ListItemTextProps, "primary">) => {
  const [isDrawerOpened, setIsDrawerOpened] = useState(false)
  const selectedLabel = choices.find((choice) => choice.value === value)?.label

  return (
    <>
      <ListItem disablePadding>
        <ListItemButton onClick={() => setIsDrawerOpened(true)}>
          <ListItemText primary={primary} secondary={selectedLabel} />
        </ListItemButton>
      </ListItem>
      <MultipleChoiceDrawer
        open={isDrawerOpened}
        onClose={() => setIsDrawerOpened(false)}
        anchor="bottom"
        selected={value}
        choices={choices}
        onChoiceSelect={(value) => {
          onChange(value)
          setIsDrawerOpened(false)
        }}
      />
    </>
  )
}
