import fs from "node:fs"
import type { Archive } from "@prose-reader/archive-reader"
import { createUnzipperArchiveSource } from "./unzipperArchive.js"
import { getRarArchive } from "./getRarArchive.js"

/**
 * The bytes the RAR 4 and RAR 5 signatures both start with
 * (https://www.rarlab.com/technote.htm).
 */
const RAR_SIGNATURE = Buffer.from("Rar!\x1a\x07", "latin1")

const startsWithRarSignature = async (filePath: string) => {
  const file = await fs.promises.open(filePath)

  try {
    const { buffer } = await file.read({
      buffer: Buffer.alloc(RAR_SIGNATURE.length),
      position: 0,
    })

    return buffer.equals(RAR_SIGNATURE)
  } finally {
    await file.close()
  }
}

export const openArchive = async (
  filePath: string,
  options: { name?: string; encodingFormat?: string } = {},
): Promise<Archive> =>
  (await startsWithRarSignature(filePath))
    ? getRarArchive(filePath, options)
    : createUnzipperArchiveSource(filePath, options)
