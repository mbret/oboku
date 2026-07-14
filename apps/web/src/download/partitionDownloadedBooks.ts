import { PLUGIN_FILE_TYPE } from "@oboku/shared"
import type { Database } from "../rxdb/databases.shared"
import { dexieDb } from "../rxdb/dexie"

/**
 * Splits the currently downloaded books into two groups, resolving every book's
 * links in a single batched lookup:
 *
 * - `localOnly`: the book's only source is a device-local file (the `file`
 *   plugin). That file lives solely in the local `downloads` store — it is never
 *   uploaded and cannot be re-fetched (see the `file` plugin's
 *   `DownloadBookComponent`, which errors with `DOWNLOAD_DIFFERENT_DEVICE`), so
 *   wiping downloads destroys these books permanently.
 * - `removable`: the book can be re-downloaded from a cloud source (or has no
 *   links), so purging its download is safe.
 *
 * Sign-out warns on `localOnly` while the bulk purge removes `removable`;
 * sharing this classification keeps the warning and the purge in agreement.
 */
export const partitionDownloadedBooks = async (db: Database) => {
  const downloads = await dexieDb.downloads.toArray()

  const downloadedBooks = await db.book
    .find({ selector: { _id: { $in: downloads.map(({ id }) => id) } } })
    .exec()

  const linksById = await db.link
    .findByIds(downloadedBooks.flatMap((book) => book.links))
    .exec()

  const isLocalOnly = (book: (typeof downloadedBooks)[number]) =>
    book.links.some(
      (linkId) => linksById.get(linkId)?.type === PLUGIN_FILE_TYPE,
    )

  return {
    localOnly: downloadedBooks.filter(isLocalOnly),
    removable: downloadedBooks.filter((book) => !isLocalOnly(book)),
  }
}
