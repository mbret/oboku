import {
  Google,
  InsertLinkOutlined,
  PersonOutlineOutlined,
  PlagiarismOutlined,
} from "@mui/icons-material"
import {
  type BookMetadata,
  DEFAULT_REORDERABLE_BOOK_METADATA_SOURCES,
  isReorderableBookMetadataSource,
  type ReorderableBookMetadataSource,
} from "@oboku/shared"
import type { ReactNode } from "react"

export type BookMetadataSource = Exclude<BookMetadata["type"], "deprecated">

/**
 * Builds the full, ordered list of metadata sources from the user-defined
 * middle. Returned highest → lowest priority — i.e. the order rendered in
 * the UI and the order from which the merge derives its precedence.
 *
 * Defends against malformed persisted values by:
 *  - stripping anything that isn't a reorderable source (no `user`/`link`
 *    sneaking into the middle)
 *  - de-duplicating the input while preserving first occurrence, so a
 *    persisted `['file','file']` doesn't surface the same source twice
 *    (and break `key={source}` rendering downstream)
 *  - re-adding any reorderable source missing from the input, preserving
 *    the default relative order, so the result always covers every source
 *    exactly once.
 */
export const getOrderedBookMetadataSources = (
  middle: ReadonlyArray<string> | undefined,
): BookMetadataSource[] => {
  // Set gives dedupe + insertion-order iteration for free; appending the
  // defaults afterwards backfills any missing entries (existing keys are
  // a no-op) so every reorderable source appears exactly once.
  const ordered = new Set<ReorderableBookMetadataSource>(
    (middle ?? []).filter(isReorderableBookMetadataSource),
  )
  for (const source of DEFAULT_REORDERABLE_BOOK_METADATA_SOURCES) {
    ordered.add(source)
  }

  return ["user", ...ordered, "link"]
}

export const BOOK_METADATA_SOURCES: BookMetadataSource[] =
  getOrderedBookMetadataSources(undefined)

export const isBookMetadataSource = (
  value: string | undefined,
): value is BookMetadataSource =>
  BOOK_METADATA_SOURCES.includes(value as BookMetadataSource)

export const getBookMetadataSourceLabel = (
  source: BookMetadataSource,
): string => {
  switch (source) {
    case "file":
      return "File"
    case "googleBookApi":
      return "Google Book API"
    case "user":
      return "User"
    case "link":
      return "Link"
  }
}

export const getBookMetadataSourceIcon = (
  source: BookMetadataSource,
): ReactNode => {
  switch (source) {
    case "file":
      return <PlagiarismOutlined />
    case "googleBookApi":
      return <Google />
    case "user":
      return <PersonOutlineOutlined />
    case "link":
      return <InsertLinkOutlined />
  }
}
