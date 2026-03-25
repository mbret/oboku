import { signal } from "reactjrx"

const ACCESS_TOKEN_STORAGE_KEY = "oboku-admin-access-token"
const REFRESH_TOKEN_STORAGE_KEY = "oboku-admin-refresh-token"

const getPersistedItem = (key: string) => {
  if (typeof window === "undefined") {
    return null
  }

  return window.localStorage.getItem(key)
}

export const authState = signal<{
  access_token: string | null
  refresh_token: string | null
}>({
  default: {
    access_token: getPersistedItem(ACCESS_TOKEN_STORAGE_KEY),
    refresh_token: getPersistedItem(REFRESH_TOKEN_STORAGE_KEY),
  },
})

const persistItem = (key: string, value: string | null) => {
  if (typeof window === "undefined") {
    return
  }

  if (value) {
    window.localStorage.setItem(key, value)
  } else {
    window.localStorage.removeItem(key)
  }
}

export const persistTokens = (tokens: {
  access_token: string | null
  refresh_token: string | null
}) => {
  persistItem(ACCESS_TOKEN_STORAGE_KEY, tokens.access_token)
  persistItem(REFRESH_TOKEN_STORAGE_KEY, tokens.refresh_token)
}

export const clearTokens = () => {
  persistTokens({ access_token: null, refresh_token: null })
  authState.update({
    access_token: null,
    refresh_token: null,
  })
}
