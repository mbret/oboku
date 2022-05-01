import { Archive } from "@prose-reader/streamer"
import { getBookFile } from "../../download/getBookFile.shared"
import { Report } from "../../debug/report.shared"
import { getArchiveForFile } from "./getArchiveForFile.shared"

export class FileNotFoundError extends Error {}
export class FileNotSupportedError extends Error {}

let loading = false
let archive: Archive | undefined = undefined
let lastUrl: string | undefined
let cleanupInterval: NodeJS.Timeout | number

const cleanup = () => {
  clearInterval(cleanupInterval as NodeJS.Timeout)
  cleanupInterval = setInterval(() => {
    if (!loading && archive) {
      Report.log(
        `serviceWorker`,
        `cleaning up unused epub archive reference (after 5mn)`
      )
      archive = undefined
      lastUrl = undefined
    }
  }, 5 * 60 * 1000)
}

export const loadBook = Report.measurePerformance(
  `serviceWorker`,
  Infinity,
  async (bookId: string) => {
    cleanup()
    if (bookId !== lastUrl) {
      archive = undefined
      loading = false
    }
    if (archive) {
      loading = false
      return archive
    }
    if (loading) {
      return new Promise<Archive>((resolve, reject) => {
        setTimeout(async () => {
          try {
            resolve(await loadBook(bookId))
          } catch (e) {
            reject(e)
          }
        }, 100)
      })
    }
    loading = true
    archive = undefined

    const file = await getBookFile(bookId)

    if (!file) {
      loading = false
      throw new FileNotFoundError(`FileNotFoundError`)
    }

    const newArchive = await getArchiveForFile(file)

    if (!newArchive) {
      loading = false
      throw new FileNotSupportedError(`FileNotSupportedError`)
    }

    archive = newArchive
    lastUrl = bookId
    loading = false

    return archive
  }
)
