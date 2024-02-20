import { signal } from "reactjrx"

export const appTourSignal = signal<{
  currentOpenedTour: string | undefined
}>({
  key: "appTourState",
  default: {
    currentOpenedTour: undefined
  }
})
