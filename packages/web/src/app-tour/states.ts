import { signal } from "reactjrx"

export const [useAppTourState, setAppTourState] = signal<{
  currentOpenedTour: string | undefined
}>({
  key: "appTourState",
  default: {
    currentOpenedTour: undefined
  }
})
