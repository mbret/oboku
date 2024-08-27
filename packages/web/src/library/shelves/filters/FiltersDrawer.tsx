import { FC, memo, useState } from "react"
import {
  Drawer,
  List,
  ListItemText,
  ListItemIcon,
  ListItemButton
} from "@mui/material"
import {
  ArrowForwardIosRounded,
  CheckCircleRounded,
  RadioButtonUncheckedOutlined
} from "@mui/icons-material"
import { useSignalValue } from "reactjrx"
import {
  ReadingStateFilterDialog,
  getDisplayableReadingState
} from "./ReadingStateFilterDialog"
import { libraryShelvesSettingsSignal } from "../state"

export const FiltersDrawer: FC<{
  open: boolean
  onClose: () => void
}> = memo(({ open, onClose }) => {
  const [isReadingStateDialogOpened, setIsReadingStateDialogOpened] =
    useState(false)
  const { readingState: collectionReadingState, showNotInterestedCollections } =
    useSignalValue(
      libraryShelvesSettingsSignal,
      ({ readingState, showNotInterestedCollections }) => ({
        readingState,
        showNotInterestedCollections
      })
    )

  return (
    <>
      <Drawer anchor="bottom" open={open} onClose={onClose}>
        <div role="presentation">
          <List>
            <ListItemButton
              onClick={() => {
                setIsReadingStateDialogOpened(true)
              }}
            >
              <ListItemText
                primary="Reading state"
                secondary={getDisplayableReadingState(collectionReadingState)}
              />
              <ListItemIcon>
                <ArrowForwardIosRounded />
              </ListItemIcon>
            </ListItemButton>
            <ListItemButton
              onClick={() =>
                libraryShelvesSettingsSignal.setValue((state) => ({
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
      <ReadingStateFilterDialog
        open={isReadingStateDialogOpened}
        onClose={() => setIsReadingStateDialogOpened(false)}
      />
    </>
  )
})
