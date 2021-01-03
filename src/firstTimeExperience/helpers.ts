import { useRecoilCallback } from "recoil";
import { firstTimeExperienceState } from "./firstTimeExperienceStates";

export const useResetFirstTimeExperience = () =>
  useRecoilCallback(({ reset }) => () => {
    reset(firstTimeExperienceState)
  })