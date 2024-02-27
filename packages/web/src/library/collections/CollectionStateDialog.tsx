import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup
} from "@mui/material"
import { FC } from "react"
import { useSignalValue } from "reactjrx"
import { collectionsListSignal } from "./state"

type State = ReturnType<(typeof collectionsListSignal)["getValue"]>
type ReadingState = State["readingState"]

export const getDisplayableReadingState = (readingState: ReadingState) => {
  switch (readingState) {
    case "ongoing":
      return "Ongoing"
    case "finished":
      return "Finished"
    default:
      return "Any"
  }
}

export const CollectionReadingStateDialog: FC<{
  open: boolean
  onClose: () => void
}> = ({ open, onClose }) => {
  const state = useSignalValue(collectionsListSignal)
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
              collectionsListSignal.setValue((state) => ({
                ...state,
                readingState: event.target.value as ReadingState
              }))
            }}
          >
            {readingStates.map((readingState) => (
              <FormControlLabel
                key={readingState}
                value={readingState}
                control={<Radio />}
                label={getDisplayableReadingState(readingState)}
              />
            ))}
          </RadioGroup>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} autoFocus>
          Ok
        </Button>
      </DialogActions>
    </Dialog>
  )
}
