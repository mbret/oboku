import { signal } from "reactjrx"

const AUTH_TOKEN_STORAGE_KEY = "oboku-admin-access-token"

const getPersistedAccessToken = () => {
  if (typeof window === "undefined") {
    return null
  }

  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
}

export const authState = signal<{
  access_token: string | null
}>({
  default: {
    access_token: getPersistedAccessToken(),
  },
})

export const persistAccessToken = (accessToken: string | null) => {
  if (typeof window === "undefined") {
    return
  }

  if (accessToken) {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, accessToken)
    return
  }

  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
}

export const clearAccessToken = () => {
  persistAccessToken(null)
  authState.update({
    access_token: null,
  })
}
