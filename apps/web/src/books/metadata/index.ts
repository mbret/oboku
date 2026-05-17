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

type DirectiveEntry = { type: "directive" } & Pick<
  BookMetadataFields,
  "isbn" | "googleVolumeId"
> & {
    [K in Exclude<keyof BookMetadataFields, "isbn" | "googleVolumeId">]?: never
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
  const directiveEntry: DirectiveEntry | undefined =
    linkDirectives?.isbn !== undefined ||
    linkDirectives?.googleVolumeId !== undefined
      ? {
          type: "directive",
          isbn: linkDirectives?.isbn,
          googleVolumeId: linkDirectives?.googleVolumeId,
        }
      : undefined

  const priorityLowestFirst: string[] = [
    ...getOrderedBookMetadataSources(book?.metadataSourcePriority)
      .filter((source) => source !== "user")
      .toReversed(),
    "directive",
    "user",
  ]

  const orderedList = [
    ...list,
    ...(directiveEntry ? [directiveEntry] : []),
  ].toSorted(
    (a, b) =>
      priorityLowestFirst.indexOf(a.type) - priorityLowestFirst.indexOf(b.type),
  )

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
