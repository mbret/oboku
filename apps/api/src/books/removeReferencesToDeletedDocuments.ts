import type createNano from "nano"
import { bulkUpdate } from "../couch/bulkUpdate.js"
import { find } from "../couch/dbHelpers.js"
import { fetchDocumentStates } from "../couch/fetchDocumentStates.js"

/**
 * Removes every id whose document CouchDB holds as deleted from the references
 * between the documents of a user database: a book's collections, tags and
 * links, a collection's and a tag's books, and a library sync's tags. Resolves
 * with how many documents it updated. An id CouchDB has never seen stays: a
 * device may not have pushed that document yet.
 */
export const removeReferencesToDeletedDocuments = async (
  db: Pick<createNano.DocumentScope<unknown>, "find" | "fetchRevs" | "bulk">,
) => {
  const [books, collections, tags, librarySyncs] = await Promise.all([
    find(db, "book", {}),
    find(db, "obokucollection", {}),
    find(db, "tag", {}),
    find(db, "datasource", {}),
  ])
  const liveIdsAlreadyRead = new Set(
    [...books, ...collections, ...tags].map((doc) => doc._id),
  )
  const referencedIds = [
    ...books.flatMap((book) => [
      ...book.collections,
      ...book.tags,
      ...book.links,
    ]),
    ...collections.flatMap((collection) => collection.books),
    ...tags.flatMap((tag) => tag.books),
    ...librarySyncs.flatMap((librarySync) => librarySync.tags ?? []),
  ]
  const { deletedIds } = await fetchDocumentStates(
    db,
    referencedIds.filter((id) => !liveIdsAlreadyRead.has(id)),
  )

  if (deletedIds.size === 0) return 0

  const isDeleted = (id: string) => deletedIds.has(id)
  const withoutDeleted = (ids: readonly string[]) =>
    ids.filter((id) => !isDeleted(id))

  const updatedBooks = books.flatMap(function withoutDeletedReferences(book) {
    const hasDeletedReference = [book.collections, book.tags, book.links].some(
      (ids) => ids.some(isDeleted),
    )

    return hasDeletedReference
      ? [
          {
            ...book,
            collections: withoutDeleted(book.collections),
            tags: withoutDeleted(book.tags),
            links: withoutDeleted(book.links),
          },
        ]
      : []
  })
  const updatedCollections = collections.flatMap(
    function withoutDeletedBooks(collection) {
      return collection.books.some(isDeleted)
        ? [{ ...collection, books: withoutDeleted(collection.books) }]
        : []
    },
  )
  const updatedTags = tags.flatMap(function withoutDeletedBooks(tag) {
    return tag.books.some(isDeleted)
      ? [{ ...tag, books: withoutDeleted(tag.books) }]
      : []
  })
  const updatedLibrarySyncs = librarySyncs.flatMap(
    function withoutDeletedTags(librarySync) {
      const librarySyncTags = librarySync.tags ?? []

      return librarySyncTags.some(isDeleted)
        ? [{ ...librarySync, tags: withoutDeleted(librarySyncTags) }]
        : []
    },
  )

  const updatedIds = await bulkUpdate(db, [
    ...updatedBooks,
    ...updatedCollections,
    ...updatedTags,
    ...updatedLibrarySyncs,
  ])

  return updatedIds.length
}
