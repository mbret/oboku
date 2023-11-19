import { FirstTimeExperienceId } from "./constants"
import { signal } from "reactjrx"

export const firstTimeExperienceStateSignal = signal<{
  [key in FirstTimeExperienceId]?: number
}>({
  key: "firstTimeExperienceState",
  default: {
    [FirstTimeExperienceId.APP_TOUR_FIRST_TOUR_TAGS]: 0,
    [FirstTimeExperienceId.APP_TOUR_READER]: 0,
    [FirstTimeExperienceId.APP_TOUR_WELCOME]: 0,
    [FirstTimeExperienceId.APP_TOUR_FIRST_ADDING_BOOK]: 0
  }
})

export const firstTimeExperienceStatePersist = firstTimeExperienceStateSignal
export const isTagsTourPossibleStateSignal = signal({
  key: "isTagsTourPossibleState",
  default: false
})
