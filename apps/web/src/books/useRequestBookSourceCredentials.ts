import type { UseMutationOptions } from "@tanstack/react-query"
import { usePluginRefreshMetadata } from "../integrations/plugins/usePluginRefreshMetadata"
import { ensureDatabase, useDatabase } from "../rxdb"
import { getBookById } from "./dbHelpers"

/**
 * Asks the source of a book's file for the credentials oboku's server reads
 * that file with. The source opens a prompt when it needs one: its sign-in,
 * or the master password for a connector.
 *
 * @returns a function that resolves with the credentials, or with none when
 * the database holds no file for the book. It rejects while no database is
 * open, and with what the source rejects with: a `CancelError` when the user
 * closes that prompt.
 */
export const useRequestBookSourceCredentials = (
  options?: Pick<UseMutationOptions, "meta">,
) => {
  const { db } = useDatabase()
  const requestSourceCredentials = usePluginRefreshMetadata(options)

  return async function requestBookSourceCredentials(bookId: string) {
    const database = ensureDatabase(db)
    const book = await getBookById({ database, id: bookId })
    const firstLinkId = book?.links[0]
    const firstLink = firstLinkId
      ? await database.link.findOne(firstLinkId).exec()
      : null

    if (!firstLink) return undefined

    const { providerCredentials } = await requestSourceCredentials({
      linkType: firstLink.type,
      linkData: firstLink.data,
    })

    return providerCredentials
  }
}
