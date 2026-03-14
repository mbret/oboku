import { authState, clearAccessToken } from "./states"

export const authenticatedFetch = async (input: string, init?: RequestInit) => {
  const response = await fetch(input, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${authState.value.access_token}`,
    },
  })

  if (response.status === 401) {
    clearAccessToken()
    throw new Error("Session expired")
  }

  return response
}
