import {
  type BookDocType,
  type DeprecatedBookDocType,
  type BookMetadata,
  directives,
} from "@oboku/shared"
import { useMemo } from "react"
import type { DeepReadonlyObject, RxDocument } from "rxdb"

type Return = DeepReadonlyObject<Omit<BookMetadata, "type">> & {
  language?: string
  displayableDate?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        Pick<BookDocType, "metadata"> &
          Partial<Pick<DeprecatedBookDocType, "title" | "creator">>
      >
    | null
    | RxDocument<
        BookDocType & Partial<Pick<DeprecatedBookDocType, "title" | "creator">>
      >,
): Return => {
  const medataList = book?.metadata
  const list = medataList ?? []
  const deprecated: BookMetadata = {
    type: "deprecated",
    title: book?.title || undefined,
    authors: book?.creator ? [book.creator] : undefined,
  }

  /**
   * link is the raw format, we don't want it to be on top
   */
  const orderedList = [deprecated, ...list].sort((a) =>
    a.type === "link" ? -1 : 1,
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
    title: directives.removeDirectiveFromString(reducedMetadata.title ?? ""),
  }
}

export const useMedataFromBook = (
  book?: DeepReadonlyObject<BookDocType & Partial<DeprecatedBookDocType>>,
) => {
  const { metadata, title, creator } = book ?? {}

  return useMemo(() => {
    return getMetadataFromBook({
      creator: creator ?? null,
      title: title ?? null,
      metadata,
    })
  }, [metadata, title, creator])
}
