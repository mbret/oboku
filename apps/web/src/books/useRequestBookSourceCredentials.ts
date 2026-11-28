import type { UseMutationOptions } from "@tanstack/react-query"
import { usePluginRefreshMetadata } from "../integrations/plugins/usePluginRefreshMetadata"
import { ensureDatabase, useDatabase } from "../rxdb"

/**
 * Asks the source of a book's file for the credentials oboku's server reads
 * that file with. The sign-in of the source opens when the source needs one.
 *
 * @returns a function that resolves with none for a book that has no file.
 */
export const useRequestBookSourceCredentials = (
  options?: Pick<UseMutationOptions, "meta">,
) => {
  const { db } = useDatabase()
  const requestSourceCredentials = usePluginRefreshMetadata(options)

  return async function requestBookSourceCredentials(bookId: string) {
    const database = ensureDatabase(db)
    const book = await database.book
      .findOne({ selector: { _id: bookId } })
      .exec()
    const firstLinkId = book?.links[0]
    const firstLink = firstLinkId
      ? await database.link.findOne(firstLinkId).exec()
      : null

    if (!firstLink) return undefined

    return requestSourceCredentials({
      linkId: firstLink._id,
      linkType: firstLink.type,
      linkData: firstLink.data,
    })
  }
}
