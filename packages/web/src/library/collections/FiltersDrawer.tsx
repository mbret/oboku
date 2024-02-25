import { FC, memo } from "react"
import {
  Drawer,
  List,
  ListItemText,
  ListItemIcon,
  ListItemButton
} from "@mui/material"
import {
  CheckCircleRounded,
  RadioButtonUncheckedOutlined
} from "@mui/icons-material"
import { useSignalValue } from "reactjrx"
import { libraryStateSignal } from "../states"

export const FiltersDrawer: FC<{
  open: boolean
  onClose: () => void
}> = memo(({ open, onClose }) => {
  const { showNotInterestedCollections } = useSignalValue(
    libraryStateSignal,
    ({ showNotInterestedCollections }) => ({ showNotInterestedCollections })
  )

  return (
    <>
      <Drawer anchor="bottom" open={open} onClose={onClose}>
        <div role="presentation">
          <List>
            <ListItemButton
              onClick={() =>
                libraryStateSignal.setValue((state) => ({
                  ...state,
                  showNotInterestedCollections:
                    !state.showNotInterestedCollections
                }))
              }
            >
              <ListItemText
                primary="Show not interested collections"
                secondary="Does not hide collections which contains only not interested books"
              />
              <ListItemIcon>
                {showNotInterestedCollections ? (
                  <CheckCircleRounded />
                ) : (
                  <RadioButtonUncheckedOutlined />
                )}
              </ListItemIcon>
            </ListItemButton>
          </List>
        </div>
      </Drawer>
    </>
  )
})
