const BASIC_SCHEME_PREFIX = "basic "

/**
 * The credentials an `Authorization: Basic` header carries, undefined for no
 * header, another scheme or credentials without a colon. The scheme matches
 * in any case, as RFC 7235 §2.1 requires.
 */
export const parseBasicAuthorization = (header: string | undefined) => {
  const isBasicScheme =
    header?.slice(0, BASIC_SCHEME_PREFIX.length).toLowerCase() ===
    BASIC_SCHEME_PREFIX

  if (!header || !isBasicScheme) return undefined

  const decoded = Buffer.from(
    header.slice(BASIC_SCHEME_PREFIX.length),
    "base64",
  ).toString("utf8")
  const separatorIndex = decoded.indexOf(":")

  if (separatorIndex === -1) return undefined

  return {
    username: decoded.slice(0, separatorIndex),
    password: decoded.slice(separatorIndex + 1),
  }
}
