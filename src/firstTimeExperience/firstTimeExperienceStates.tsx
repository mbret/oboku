import { atom } from "recoil";

export const firstTimeExperienceState = atom({
  key: 'firstTimeExperienceState',
  default: {
    hasDoneWelcomeTour: false,
    hasDoneReaderTour: false,
    hasDoneFirstTimeAddingBook: false,
  }
})