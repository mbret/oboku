/**
 * The scheme the original client used, read from `X-Forwarded-Proto`, or
 * undefined when the header is absent (callers fall back to the direct
 * connection). A chain of proxies joins hops with commas ("https, http") and
 * the outermost (first) hop faces the client; a repeated header instead arrives
 * as an array whose first entry is likewise the outermost. Both forms collapse
 * to that single outermost value here so every consumer agrees on the scheme.
 */
export const getForwardedProto = (
  header: string | string[] | undefined,
): string | undefined => {
  const outermost = Array.isArray(header) ? header[0] : header

  return outermost?.split(",")[0]?.trim() || undefined
}
