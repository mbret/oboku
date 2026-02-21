import { type FC, memo } from "react"
import { Drawer, List, ListItemText, ListItemButton } from "@mui/material"
import { type SignalValue, useSignalValue } from "reactjrx"
import { searchListActionsToolbarSignal } from "./states"

export const FiltersDrawer: FC<{
  open: boolean
  onClose: () => void
}> = memo(({ open, onClose }) => {
  const { notInterestedContents } = useSignalValue(
    searchListActionsToolbarSignal,
  )

  const getNotInterestedLabelFromValue = (
    value: SignalValue<
      typeof searchListActionsToolbarSignal
    >["notInterestedContents"],
  ) => {
    switch (value) {
      case "only":
        return "Only"
      case "with":
        return "Yes"
      default:
        ;("None")
    }

    return "None"
  }

  return (
    <Drawer anchor="bottom" open={open} onClose={onClose}>
      <div role="presentation">
        <List>
          <ListItemButton
            onClick={() =>
              searchListActionsToolbarSignal.update((state) => ({
                ...state,
                notInterestedContents:
                  state.notInterestedContents === "none"
                    ? ("with" as const)
                    : state.notInterestedContents === "with"
                      ? ("only" as const)
                      : ("none" as const),
              }))
            }
          >
            <ListItemText
              primary="Show not interested contents"
              secondary={getNotInterestedLabelFromValue(notInterestedContents)}
            />
          </ListItemButton>
        </List>
      </div>
    </Drawer>
  )
})
