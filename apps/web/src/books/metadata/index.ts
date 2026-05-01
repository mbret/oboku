import {
  type BookDocType,
  type BookMetadataFields,
  directives,
} from "@oboku/shared"
import { useMemo } from "react"
import type { DeepReadonlyObject, RxDocument } from "rxdb"
import { getOrderedBookMetadataSources } from "./sources"

type Return = DeepReadonlyObject<BookMetadataFields> & {
  language?: string
  displayableDate?: string
}

type GenericObject = { [key: string]: any }

function mergeObjects(a: GenericObject, b: GenericObject): GenericObject {
  return Object.entries(b).reduce(
    (acc, [key, value]) => {
      // If the value in `b` is not `undefined`, use it; otherwise, retain the value from `a`.
      acc[key] = value !== undefined ? value : a[key]

      return acc
    },
    { ...a },
  ) // Start with a shallow copy of `a` to ensure we don't mutate it.
}

export const getMetadataFromBook = (
  book?:
    | DeepReadonlyObject<
        Pick<BookDocType, "metadata" | "metadataSourcePriority">
      >
    | null
    | RxDocument<BookDocType>,
): Return => {
  const list = book?.metadata ?? []

  /**
   * Effective merge priority, lowest → highest. Later items override
   * earlier ones in the reduce below, so the first entries are the
   * weakest sources.
   *
   * Sources are ordered in **reverse** of the user-defined display
   * priority returned by {@link getOrderedBookMetadataSources}, so that
   * `user` ends up last (winning) and `link` first (losing to every
   * typed source).
   */
  const displayPriority = getOrderedBookMetadataSources(
    book?.metadataSourcePriority,
  )
  const sourceWeight = new Map<string, number>(
    displayPriority.map((source, index) => [source, index]),
  )
  const orderedList = [...list].sort((a, b) => {
    // Unknown types fall back to the weakest position (sorted first, reduced
    // first, overridden by every known source) for forward-compat with docs
    // written by newer clients that introduced a source we don't know about.
    const aWeight = sourceWeight.get(a.type) ?? Number.POSITIVE_INFINITY
    const bWeight = sourceWeight.get(b.type) ?? Number.POSITIVE_INFINITY

    // Higher displayPriority index === lower priority, so it comes first
    // (gets overridden by later entries).
    return bWeight - aWeight
  })

  /**
   * Filename directives are the canonical source for `isbn` and
   * `googleVolumeId` — they live in the link's title and are parsed on
   * demand here so consumers see the effective values without us
   * persisting a duplicate that could go stale.
   */
  const linkEntry = list.find((item) => item.type === "link")
  const linkDirectives = linkEntry?.title
    ? directives.extractDirectivesFromName(linkEntry.title.toString())
    : undefined

  const reducedMetadata = orderedList.reduce((acc, item) => {
    const mergedValue = mergeObjects(acc, item) as Return

    const date = Object.values(item.date ?? {}).length ? item.date : acc.date
    const subjects = item.subjects?.length ? item.subjects : acc.subjects

    return {
      ...mergedValue,
      date,
      subjects,
      authors: [...(acc.authors ?? []), ...(item.authors ?? [])],
      language: (mergedValue.languages ?? [])[0],
      displayableDate:
        Object.keys(date ?? {}).length === 3
          ? new Date(`${date?.year} ${date?.month} ${date?.day}`).toDateString()
          : date?.year !== undefined && date.month !== undefined
            ? `${date?.year} ${date?.month}`
            : date?.year !== undefined
              ? `${date?.year}`
              : undefined,
    } satisfies Return
  }, {} as Return)

  return {
    ...reducedMetadata,
    isbn: reducedMetadata.isbn ?? linkDirectives?.isbn,
    googleVolumeId:
      reducedMetadata.googleVolumeId ?? linkDirectives?.googleVolumeId,
    title: directives.removeDirectiveFromString(
      reducedMetadata.title?.toString() ?? "",
    ),
  }
}

export const useMetadataFromBook = (
  book?: DeepReadonlyObject<BookDocType> | null,
) => {
  const { metadata, metadataSourcePriority } = book ?? {}

  return useMemo(() => {
    return getMetadataFromBook({ metadata, metadataSourcePriority })
  }, [metadata, metadataSourcePriority])
}
