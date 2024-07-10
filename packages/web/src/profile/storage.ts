import { createLocalStorageAdapter, signal } from "reactjrx"
import { currentProfileSignal } from "./currentProfile"

export const profileStorageSignal = signal({
  get: (get) => {
    const profile = get(currentProfileSignal)

    return !profile
      ? undefined
      : createLocalStorageAdapter({
          key: `profile-${profile}`
        })
  }
})
