import {
  catalogIdentifierFromUrl,
  catalogUrlFromIdentifier,
  normalizeIdentifierScheme,
  type MetadataIdentifier,
} from "@prose-reader/archive-reader"
import { URL_IDENTIFIER_SCHEME } from "@oboku/archive-metadata/web"

/**
 * A catalog link is the same identifier as the tagged one it points at, so it
 * is folded back to that scheme and its bare id — which is also what makes it
 * dedupe against the OPF's copy.
 */
export const catalogIdentifier = ({
  scheme,
  value,
}: MetadataIdentifier): MetadataIdentifier | undefined =>
  normalizeIdentifierScheme(scheme) === URL_IDENTIFIER_SCHEME
    ? catalogIdentifierFromUrl(value)
    : undefined

/**
 * A catalog accepts more spellings of its own id than it addresses records by
 * — a bare `OL7353617M` for `/books/OL7353617M` — and the two containers can
 * each hold a different one. Rebuilding the link and reading it back yields
 * the spelling the catalog itself uses, so the same identifier collapses to
 * one row however it was written.
 */
export const canonicalIdentifier = (
  identifier: MetadataIdentifier,
): MetadataIdentifier => {
  const url = catalogUrlFromIdentifier(identifier)

  return (
    (url === undefined ? undefined : catalogIdentifierFromUrl(url)) ??
    identifier
  )
}
