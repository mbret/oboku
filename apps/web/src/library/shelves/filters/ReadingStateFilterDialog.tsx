import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from "@mui/material"
import { memo } from "react"
import { type SignalValue, useSignalValue } from "reactjrx"
import { libraryShelvesFiltersSignal } from "./states"
import { CancelButton } from "../../../common/forms/CancelButton"

type State = SignalValue<typeof libraryShelvesFiltersSignal>
type ReadingState = State["readingState"]

export const getLabel = (readingState: ReadingState) => {
  switch (readingState) {
    case "ongoing":
      return "Ongoing"
    case "finished":
      return "Finished"
    default:
      return "Any"
  }
}

export const ReadingStateFilterDialog = memo(
  ({ open, onClose }: { open: boolean; onClose: () => void }) => {
    const state = useSignalValue(libraryShelvesFiltersSignal)
    const readingStates = ["any", "ongoing", "finished"] as ReadingState[]

    return (
      <Dialog onClose={onClose} open={open}>
        <DialogTitle>Reading state</DialogTitle>
        <DialogContent>
          <FormControl>
            <RadioGroup
              name="collection-state-radio-group"
              value={state.readingState}
              onChange={(event) => {
                libraryShelvesFiltersSignal.setValue((state) => ({
                  ...state,
                  readingState: event.target.value as ReadingState,
                }))
                onClose()
              }}
            >
              {readingStates.map((readingState) => (
                <FormControlLabel
                  key={readingState}
                  value={readingState}
                  control={<Radio />}
                  label={getLabel(readingState)}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <CancelButton onClick={onClose} variant="outlined" autoFocus />
        </DialogActions>
      </Dialog>
    )
  },
)
