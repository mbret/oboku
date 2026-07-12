import { PLUGIN_FILE_TYPE } from "@oboku/shared"
import type { Database } from "../rxdb/databases.shared"
import { dexieDb } from "../rxdb/dexie"

/**
 * Number of downloaded books whose only source is a device-local file (the
 * `file` plugin). That file lives solely in the local `downloads` store — it is
 * never uploaded and cannot be re-fetched (see the `file` plugin's
 * `DownloadBookComponent`, which errors with `DOWNLOAD_DIFFERENT_DEVICE`), so
 * wiping downloads destroys these books permanently. Used to warn before a
 * destructive purge such as sign-out.
 */
export const countLocalOnlyDownloadedBooks = async (db: Database) => {
  const downloads = await dexieDb.downloads.toArray()

  if (downloads.length === 0) return 0

  const downloadedBooks = await db.book
    .find({ selector: { _id: { $in: downloads.map(({ id }) => id) } } })
    .exec()

  const localOnlyFlags = await Promise.all(
    downloadedBooks.map(async function hasLocalOnlyFile(book) {
      if (book.links.length === 0) return false

      const links = await db.link.findByIds(book.links).exec()

      return Array.from(links?.values() ?? []).some(
        ({ type }) => type === PLUGIN_FILE_TYPE,
      )
    }),
  )

  return localOnlyFlags.filter(Boolean).length
}
