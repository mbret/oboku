import {
  type BookDocType,
  type BookMetadataFields,
  type BookMetadataSource,
  directives,
  getBookMetadataSource,
  type ReadonlyBookMetadataFields,
} from "@oboku/shared"
import { useMemo } from "react"
import type { DeepReadonlyObject, RxDocument } from "rxdb"
import { getBookMetadataEntryFields } from "./fields"
import { getOrderedBookMetadataSources } from "./sources"

type Return = DeepReadonlyObject<BookMetadataFields> & {
  language?: string
}

/**
 * One input of the merge: an entry of the book, or the directives parsed
 * from its link's filename, which rank just below the user.
 */
type MergeLayer = {
  source: BookMetadataSource | "directive"
  fields: ReadonlyBookMetadataFields
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

  const linkEntry = list.find((item) => item.type === "link")
  const linkDirectives = linkEntry?.title
    ? directives.extractDirectivesFromName(linkEntry.title.toString())
    : undefined
  const directiveLayer: MergeLayer | undefined =
    linkDirectives?.isbn !== undefined ||
    linkDirectives?.googleVolumeId !== undefined
      ? {
          source: "directive",
          fields: {
            isbn: linkDirectives?.isbn,
            googleVolumeId: linkDirectives?.googleVolumeId,
          },
        }
      : undefined

  const priorityLowestFirst: MergeLayer["source"][] = [
    ...getOrderedBookMetadataSources(book?.metadataSourcePriority)
      .filter((source) => source !== "user")
      .toReversed(),
    "directive",
    "user",
  ]

  const orderedLayers = [
    ...list.map(
      (entry): MergeLayer => ({
        source: getBookMetadataSource(entry),
        fields: getBookMetadataEntryFields(entry),
      }),
    ),
    ...(directiveLayer ? [directiveLayer] : []),
  ].toSorted(
    (a, b) =>
      priorityLowestFirst.indexOf(a.source) -
      priorityLowestFirst.indexOf(b.source),
  )

  const reducedMetadata = orderedLayers.reduce((acc, { fields: item }) => {
    const mergedValue = mergeObjects(acc, item) as Return

    const date = Object.values(item.date ?? {}).length ? item.date : acc.date
    const subjects = item.subjects?.length ? item.subjects : acc.subjects

    return {
      ...mergedValue,
      date,
      subjects,
      authors: [...(acc.authors ?? []), ...(item.authors ?? [])],
      language: (mergedValue.languages ?? [])[0],
    } satisfies Return
  }, {} as Return)

  return {
    ...reducedMetadata,
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
