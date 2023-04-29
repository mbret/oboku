import { FirstTimeExperienceId } from "./constants"
import { signal, withPersistance } from "reactjrx"

export const [
  firstTimeExperienceStatePersist,
  useFirstTimeExperienceState,
  setFirstTimeExperienceState
] = withPersistance(
  signal<{
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
)

export const [useIsTagsTourPossibleState, setIsTagsTourPossibleState] = signal({
  key: "isTagsTourPossibleState",
  default: false
})
