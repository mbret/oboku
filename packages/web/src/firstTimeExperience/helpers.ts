import { useCallback } from "react"
import { FirstTimeExperience, FirstTimeExperienceId } from "./constants"
import {
  setFirstTimeExperienceState,
  useFirstTimeExperienceState
} from "./firstTimeExperienceStates"

export const useHasDoneFirstTimeExperience = (id: FirstTimeExperienceId) => {
  const firstTimeExperience = useFirstTimeExperienceState()

  const latestVersion =
    FirstTimeExperience.find((entry) => entry.id === id)?.version || 0
  const currentDoneVersion = firstTimeExperience[id] || 0

  return currentDoneVersion >= latestVersion
}

export const useValidateFirstTimeExperience = (id: FirstTimeExperienceId) => {
  const latestVersion =
    FirstTimeExperience.find((entry) => entry.id === id)?.version || 0

  return useCallback(() => {
    setFirstTimeExperienceState((old) => ({ ...old, [id]: latestVersion }))
  }, [id, latestVersion])
}
