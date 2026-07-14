const AUTH_COOKIES_LOCK = "oboku-auth-cookies"

/**
 * The browser writes a response's Set-Cookie headers into the cookie jar the
 * moment the response arrives, so when two cookie-mutating auth responses race
 * (e.g. a token refresh that was already in flight when the user signed in as
 * someone else), whichever lands last owns the jar — even when it belongs to
 * the older session. Holding this per-origin lock (shared with the service
 * worker) for the full duration of every cookie-mutating auth fetch guarantees
 * a request started later also lands later. The lock is not reentrant: callers
 * must skip the refresh-on-401 interceptor, which would re-acquire it.
 */
export const withAuthCookiesLock = async <T>(
  task: () => Promise<T>,
): Promise<Awaited<T>> => await navigator.locks.request(AUTH_COOKIES_LOCK, task)
