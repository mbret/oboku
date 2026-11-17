import type { ComponentProps } from "react"
import { Drawer, List, ListItemButton, ListItemText } from "@mui/material"
import { useLingui } from "@lingui/react/macro"

export const MultipleChoiceDrawer = <
  Choice extends { value: string; label: string },
>({
  choices,
  onChoiceSelect,
  selected,
  ...rest
}: {
  choices: Choice[]
  onChoiceSelect: (value: Choice["value"]) => void
  selected: Choice["value"]
} & ComponentProps<typeof Drawer>) => {
  const { t } = useLingui()

  return (
    <Drawer {...rest}>
      <List>
        {choices.map(({ value, label }) => (
          <ListItemButton
            key={value}
            onClick={(_e) => {
              onChoiceSelect(value)
            }}
          >
            <ListItemText
              primary={label}
              {...(selected === value && {
                secondary: t`selected`,
              })}
            />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  )
}
