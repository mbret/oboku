import type { AuthSession } from "../../auth/types"

export type SwAuthResponder = {
  getAuthSession: () => AuthSession | null
  refreshAuthSession: (refreshToken: string) => Promise<boolean>
}

/**
 * React-scoped bridge letting the module-level service-worker message handler
 * answer auth requests through the same query-backed closures the HTTP
 * interceptors use. Registered by `InstallApiInterceptors` and cleared on
 * teardown; `null` while no responder is installed.
 */
let swAuthResponder: SwAuthResponder | null = null

export const setSwAuthResponder = (responder: SwAuthResponder | null) => {
  swAuthResponder = responder
}

export const getSwAuthResponder = () => swAuthResponder
