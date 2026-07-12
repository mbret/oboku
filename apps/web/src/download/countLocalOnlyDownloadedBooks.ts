import type { Database } from "../rxdb/databases.shared"
import { partitionDownloadedBooks } from "./partitionDownloadedBooks"

/**
 * Number of downloaded books that would be permanently lost by a destructive
 * purge such as sign-out. See {@link partitionDownloadedBooks} for what makes a
 * book local-only.
 */
export const countLocalOnlyDownloadedBooks = async (db: Database) =>
  (await partitionDownloadedBooks(db)).localOnly.length
