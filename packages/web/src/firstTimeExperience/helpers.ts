import { useCallback } from "react"
import { FirstTimeExperience, FirstTimeExperienceId } from "./constants"
import { firstTimeExperienceStateSignal } from "./firstTimeExperienceStates"
import { useSignalValue } from "reactjrx"

export const useHasDoneFirstTimeExperience = (id: FirstTimeExperienceId) => {
  const firstTimeExperience = useSignalValue(firstTimeExperienceStateSignal)

  const latestVersion =
    FirstTimeExperience.find((entry) => entry.id === id)?.version || 0
  const currentDoneVersion = firstTimeExperience[id] || 0

  return currentDoneVersion >= latestVersion
}

export const useValidateFirstTimeExperience = (id: FirstTimeExperienceId) => {
  const latestVersion =
    FirstTimeExperience.find((entry) => entry.id === id)?.version || 0

  return useCallback(() => {
    firstTimeExperienceStateSignal.setValue((old) => ({
      ...old,
      [id]: latestVersion
    }))
  }, [id, latestVersion])
}
