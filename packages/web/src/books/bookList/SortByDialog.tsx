import React, { FC, useEffect, useState } from "react"
import {
  Dialog,
  DialogTitle,
  ListItemText,
  ListItem,
  List,
  ListItemIcon
} from "@mui/material"
import { RadioButtonUnchecked, RadioButtonChecked } from "@mui/icons-material"

type Sorting = "alpha" | "date" | "activity"

export const SortByDialog: FC<{
  onClose: () => void
  open: boolean
  onChange: (sort: Sorting) => void
  value?: Sorting
}> = ({ onClose, open, onChange, value = "date" }) => {
  const [innerSorting, setInnerSorting] = useState<Sorting>(value)

  useEffect(() => {
    if (value !== innerSorting) {
      setInnerSorting(value)
    }
  }, [value, innerSorting])

  const onSortChange = (newSorting: Sorting) => {
    onClose()
    setInnerSorting(newSorting)
    onChange(newSorting)
  }

  return (
    <Dialog onClose={onClose} open={open}>
      <DialogTitle>Sort by</DialogTitle>
      <List>
        <ListItem button onClick={() => onSortChange("alpha")}>
          <ListItemIcon>
            {innerSorting === "alpha" ? (
              <RadioButtonChecked />
            ) : (
              <RadioButtonUnchecked />
            )}
          </ListItemIcon>
          <ListItemText primary="Alphabetical - A > Z" />
        </ListItem>
        <ListItem button onClick={() => onSortChange("date")}>
          <ListItemIcon>
            {innerSorting === "date" ? (
              <RadioButtonChecked />
            ) : (
              <RadioButtonUnchecked />
            )}
          </ListItemIcon>
          <ListItemText primary="Date added" />
        </ListItem>
        <ListItem button onClick={() => onSortChange("activity")}>
          <ListItemIcon>
            {innerSorting === "activity" ? (
              <RadioButtonChecked />
            ) : (
              <RadioButtonUnchecked />
            )}
          </ListItemIcon>
          <ListItemText primary="Recent activity" />
        </ListItem>
      </List>
    </Dialog>
  )
}
