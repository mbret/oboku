/**
 * What the client's request looked like to the outermost proxy, read from an
 * `X-Forwarded-*` header such as `X-Forwarded-Proto` or `X-Forwarded-Host`,
 * or undefined when the header is absent (callers fall back to the direct
 * connection). A chain of proxies joins hops with commas ("https, http") and
 * the outermost (first) hop faces the client; a repeated header instead arrives
 * as an array whose first entry is likewise the outermost. Both forms collapse
 * to that single outermost value here so every consumer agrees on it.
 */
export const getOutermostForwardedValue = (
  header: string | string[] | undefined,
): string | undefined => {
  const outermost = Array.isArray(header) ? header[0] : header

  return outermost?.split(",")[0]?.trim() || undefined
}
