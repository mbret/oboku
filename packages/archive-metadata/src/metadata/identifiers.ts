import {
  normalizeIdentifierScheme,
  type MetadataIdentifierScheme,
} from "@prose-reader/archive-reader"

/**
 * Scheme meaning "this identifier carries no scheme at all". The read side
 * reports it for an untagged identifier, so writing it back as a missing
 * scheme attribute is what keeps read → edit → write → read stable.
 */
export const UNTAGGED_IDENTIFIER_SCHEME = "Unknown"

/** Scheme of an identifier that is itself a link. */
export const URL_IDENTIFIER_SCHEME = "URL"

export const isUntaggedIdentifierScheme = (
  scheme: MetadataIdentifierScheme,
): boolean =>
  normalizeIdentifierScheme(scheme) === UNTAGGED_IDENTIFIER_SCHEME ||
  scheme.trim() === ""
