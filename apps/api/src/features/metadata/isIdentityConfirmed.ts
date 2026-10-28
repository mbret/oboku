import type { CatalogMetadata } from "@oboku/shared"

const IDENTITY_MATCH_FIELDS: ReadonlyArray<
  CatalogMetadata["signals"][number]["field"]
> = ["isbn", "gtin", "identifiers"]

/**
 * Whether an identifier settled a catalog match: metadata-fetcher pins the
 * score of a match to 1 when an ISBN, a GTIN or a scheme-scoped identifier
 * agrees.
 */
export const isIdentityConfirmed = ({
  score,
  signals,
}: Pick<CatalogMetadata, "score" | "signals">) =>
  score === 1 &&
  signals.some(
    (signal) =>
      IDENTITY_MATCH_FIELDS.includes(signal.field) && signal.score === 1,
  )
