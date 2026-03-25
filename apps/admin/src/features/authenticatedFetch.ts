import { config } from "@/config"
import { authState, clearTokens, persistTokens } from "./states"

let refreshPromise: Promise<void> | null = null

const refreshAccessToken = async () => {
  const { refresh_token } = authState.value

  if (!refresh_token) {
    throw new Error("No refresh token")
  }

  const response = await fetch(`${config.apiUrl}/admin/refresh`, {
    method: "POST",
    body: JSON.stringify({ refresh_token }),
    headers: { "Content-Type": "application/json" },
  })

  if (!response.ok) {
    throw new Error("Refresh failed")
  }

  const data = await response.json()

  persistTokens({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  })
  authState.update({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  })
}

export const authenticatedFetch = async (input: string, init?: RequestInit) => {
  const response = await fetch(input, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${authState.value.access_token}`,
    },
  })

  if (response.status !== 401) {
    return response
  }

  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null
    })
  }

  try {
    await refreshPromise
  } catch {
    clearTokens()
    throw new Error("Session expired")
  }

  return fetch(input, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${authState.value.access_token}`,
    },
  })
}
