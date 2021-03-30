import { atom } from "recoil";
import { FirstTimeExperienceId } from "./constants";

export const firstTimeExperienceState = atom<{ [key in FirstTimeExperienceId]?: number }>({
  key: 'firstTimeExperienceState',
  default: {
    [FirstTimeExperienceId.APP_TOUR_FIRST_TOUR_TAGS]: 0,
    [FirstTimeExperienceId.APP_TOUR_READER]: 0,
    [FirstTimeExperienceId.APP_TOUR_WELCOME]: 0,
    [FirstTimeExperienceId.APP_TOUR_FIRST_ADDING_BOOK]: 0,
  }
})

export const isTagsTourOpenedState = atom({
  key: 'isTagsTourOpenedState',
  default: false
})