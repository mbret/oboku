import { adminSignIn, type ApiClient, createApiClient } from "@oboku/shared"
import { ADMIN_CREDENTIALS, API_URL } from "./stack"

/** A client for the generated admin functions, signed in for 15 minutes. */
export async function signInAsAdmin(): Promise<ApiClient> {
  const {
    data: { access_token },
  } = await adminSignIn({
    client: createApiClient({ baseUrl: API_URL, throwOnError: true }),
    body: ADMIN_CREDENTIALS,
  })

  return createApiClient({
    baseUrl: API_URL,
    throwOnError: true,
    headers: { Authorization: `Bearer ${access_token}` },
  })
}
