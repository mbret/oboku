import { isOpdsBookLinkData } from "@oboku/shared"
import type { SynchronizeAbleItem } from "../types.js"

type OpdsItem = SynchronizeAbleItem<"opds">

const toEntryId = ({ linkData }: OpdsItem) => {
  if (!isOpdsBookLinkData(linkData)) {
    throw new Error("An OPDS file holds the link data of a book")
  }

  return linkData.entryId
}

/**
 * A catalog can list a book in several feeds, under other titles. Every
 * listing takes the first one's data, or each sync would rewrite the book's
 * link once per listing. A top-level folder lists each book once: the sync
 * handles a folder's items concurrently, so a second listing would create the
 * book twice. Folders left without items are dropped.
 */
export const listEachBookOncePerTopFolder = (items: OpdsItem[]) => {
  const firstListings = new Map<string, OpdsItem>()

  const toListedItems = (
    folderItems: OpdsItem[],
    booksListedInTopFolder: Set<string> | undefined,
  ): OpdsItem[] =>
    folderItems.flatMap(function toListedItem(item) {
      if (item.type === "file") {
        const entryId = toEntryId(item)
        const isListedInTopFolder =
          booksListedInTopFolder?.has(entryId) ?? false

        if (isListedInTopFolder) return []

        booksListedInTopFolder?.add(entryId)

        const firstListing = firstListings.get(entryId) ?? item

        firstListings.set(entryId, firstListing)

        return [firstListing]
      }

      const listedItems = toListedItems(
        item.items ?? [],
        booksListedInTopFolder ?? new Set(),
      )

      return listedItems.length > 0 ? [{ ...item, items: listedItems }] : []
    })

  return toListedItems(items, undefined)
}
