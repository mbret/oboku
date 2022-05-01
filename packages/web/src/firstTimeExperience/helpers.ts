import { useCallback } from "react"
import { useRecoilCallback, useRecoilValue, useSetRecoilState } from "recoil"
import { FirstTimeExperience, FirstTimeExperienceId } from "./constants"
import { firstTimeExperienceState } from "./firstTimeExperienceStates"

export const useResetFirstTimeExperience = () =>
  useRecoilCallback(({ reset }) => () => {
    reset(firstTimeExperienceState)
  })

export const useHasDoneFirstTimeExperience = (id: FirstTimeExperienceId) => {
  const firstTimeExperience = useRecoilValue(firstTimeExperienceState)

  const latestVersion =
    FirstTimeExperience.find((entry) => entry.id === id)?.version || 0
  const currentdoneVersion = firstTimeExperience[id] || 0

  return currentdoneVersion >= latestVersion
}

export const useValidateFirstTimeExperience = (id: FirstTimeExperienceId) => {
  const setFirstTimeExperienceState = useSetRecoilState(
    firstTimeExperienceState
  )
  const latestVersion =
    FirstTimeExperience.find((entry) => entry.id === id)?.version || 0

  return useCallback(() => {
    setFirstTimeExperienceState((old) => ({ ...old, [id]: latestVersion }))
  }, [setFirstTimeExperienceState, id, latestVersion])
}
