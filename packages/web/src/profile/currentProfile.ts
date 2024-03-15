import { signal } from "reactjrx"

export const currentProfileSignal = signal<string | undefined>({
  default: localStorage.getItem("profile") || undefined
})

export const setProfile = (profile: string) => {
  localStorage.setItem("profile", profile)
  currentProfileSignal.setValue(profile)
}

export const removeProfile = () => {
  localStorage.removeItem("profile")
  currentProfileSignal.setValue(undefined)
}
