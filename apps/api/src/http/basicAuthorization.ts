const BASIC_SCHEME_PREFIX = "Basic "

/** The credentials an `Authorization: Basic` header carries, undefined for any other header. */
export const parseBasicAuthorization = (header: string | undefined) => {
  if (!header?.startsWith(BASIC_SCHEME_PREFIX)) return undefined

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
