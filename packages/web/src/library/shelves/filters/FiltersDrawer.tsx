import { type FC, memo, useState } from "react"
import {
  Drawer,
  List,
  ListItemText,
  ListItemIcon,
  ListItemButton,
} from "@mui/material"
import {
  ArrowForwardIosRounded,
  CheckCircleRounded,
  RadioButtonUncheckedOutlined,
} from "@mui/icons-material"
import { useSignalValue } from "reactjrx"
import { ReadingStateFilterDialog, getLabel } from "./ReadingStateFilterDialog"
import { libraryShelvesFiltersSignal } from "./states"

export const FiltersDrawer: FC<{
  open: boolean
  onClose: () => void
}> = memo(({ open, onClose }) => {
  const [isReadingStateDialogOpened, setIsReadingStateDialogOpened] =
    useState(false)
  const { readingState: collectionReadingState, showNotInterestedCollections } =
    useSignalValue(
      libraryShelvesFiltersSignal,
      ({ readingState, showNotInterestedCollections }) => ({
        readingState,
        showNotInterestedCollections,
      }),
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
                secondary={getLabel(collectionReadingState)}
              />
              <ListItemIcon>
                <ArrowForwardIosRounded />
              </ListItemIcon>
            </ListItemButton>
            <ListItemButton
              onClick={() =>
                libraryShelvesFiltersSignal.setValue((state) => ({
                  ...state,
                  showNotInterestedCollections:
                    !state.showNotInterestedCollections,
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
