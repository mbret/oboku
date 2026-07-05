import { HttpClient } from "./httpClient.shared"

/**
 * Auth rides on the httpOnly access cookie, which the browser attaches for
 * the service worker like for any client — no message-passing with the main
 * thread. A 401 (expired cookie) simply propagates; the main thread refreshes
 * on its own traffic and a foreground retry succeeds.
 */
export const httpClientApi = new HttpClient({ credentials: "include" })
