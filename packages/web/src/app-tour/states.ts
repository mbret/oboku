import { atom } from "recoil";

export const appTourState = atom<{
  currentOpenedTour: string | undefined
}>({
  key: 'appTourState',
  default: {
    currentOpenedTour: undefined
  },
});