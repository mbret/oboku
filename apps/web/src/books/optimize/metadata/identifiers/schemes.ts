import {
  catalogUrlFromIdentifier,
  normalizeIdentifierScheme,
  type KnownMetadataIdentifierScheme,
  normalizeGtin,
  normalizeIsbn,
} from "@prose-reader/archive-reader"

export const CUSTOM_SCHEME_OPTION = "custom"

export const DEFAULT_IDENTIFIER_SCHEME = "ISBN"

type IdentifierSchemeTemplate = {
  label: string
  placeholder?: string
  validate?: (value: string) => true | string
}

/**
 * Catalog values are checked against the link the writer would build for them:
 * a value the catalog cannot address has nowhere to live in a container that
 * only stores links.
 */
const isCatalogAddressable = (scheme: string, value: string): boolean =>
  catalogUrlFromIdentifier({ scheme, value }) !== undefined

const isHttpUrl = (value: string): boolean => {
  try {
    const { protocol, hostname } = new URL(value)

    return (protocol === "http:" || protocol === "https:") && hostname !== ""
  } catch {
    return false
  }
}

/**
 * Keyed by the reader's scheme union so a scheme added upstream fails to
 * compile until it is given a label and, where the format is checkable, a
 * validator. Declaration order is the order the picker offers them in.
 */
const IDENTIFIER_SCHEME_TEMPLATES: Record<
  KnownMetadataIdentifierScheme,
  IdentifierSchemeTemplate
> = {
  ISBN: {
    label: "ISBN",
    placeholder: "9783161484100",
    validate: function validateIsbn(value) {
      return normalizeIsbn(value) !== undefined
        ? true
        : "Not a recognizable ISBN-10 or ISBN-13"
    },
  },
  GoogleBooks: {
    label: "Google Books id",
    placeholder: "zyTCAlFPjgYC",
    validate: function validateGoogleBooksId(value) {
      return isCatalogAddressable("GoogleBooks", value)
        ? true
        : "Not a Google Books volume id"
    },
  },
  GTIN: {
    label: "GTIN / barcode",
    placeholder: "9783161484100",
    validate: function validateGtin(value) {
      return normalizeGtin(value) !== undefined
        ? true
        : "Not a recognizable 8, 12, 13 or 14 digit GTIN"
    },
  },
  OpenLibrary: {
    label: "Open Library",
    placeholder: "/books/OL7353617M",
    validate: function validateOpenLibraryKey(value) {
      return isCatalogAddressable("OpenLibrary", value)
        ? true
        : "Not an Open Library id, e.g. /books/OL7353617M or OL7353617M"
    },
  },
  ProjectGutenberg: {
    label: "Project Gutenberg",
    placeholder: "2701",
    validate: function validateProjectGutenbergId(value) {
      return isCatalogAddressable("ProjectGutenberg", value)
        ? true
        : "Not a Project Gutenberg ebook number"
    },
  },
  DOI: {
    label: "DOI",
    placeholder: "10.1000/182",
    validate: function validateDoi(value) {
      return isCatalogAddressable("DOI", value)
        ? true
        : "Not a DOI, e.g. 10.1000/182"
    },
  },
  URL: {
    label: "URL",
    placeholder: "https://example.com/book",
    validate: function validateUrl(value) {
      return isHttpUrl(value) ? true : "Not an http(s) URL"
    },
  },
  Unknown: {
    label: "No scheme",
  },
}

const SCHEME_TEMPLATE_ENTRIES = Object.entries(IDENTIFIER_SCHEME_TEMPLATES)

const TEMPLATES_BY_SCHEME = new Map<string, IdentifierSchemeTemplate>(
  SCHEME_TEMPLATE_ENTRIES,
)

export const IDENTIFIER_SCHEME_OPTIONS = SCHEME_TEMPLATE_ENTRIES.map(
  function toSchemeOption([scheme, { label }]) {
    return { scheme, label }
  },
)

const templateFor = (scheme: string): IdentifierSchemeTemplate | undefined =>
  TEMPLATES_BY_SCHEME.get(normalizeIdentifierScheme(scheme))

export const isPredefinedIdentifierScheme = (scheme: string): boolean =>
  templateFor(scheme) !== undefined

export const identifierSchemeLabel = (scheme: string): string =>
  templateFor(scheme)?.label ?? scheme

export const identifierValuePlaceholder = (
  scheme: string,
): string | undefined => templateFor(scheme)?.placeholder

export const validateIdentifierScheme = (scheme: string): true | string =>
  scheme.trim() === "" ? "Required" : true

export const validateIdentifierValue = (
  scheme: string,
  value: string,
): true | string => {
  const trimmed = value.trim()

  if (trimmed === "") return "Required"

  return templateFor(scheme)?.validate?.(trimmed) ?? true
}
