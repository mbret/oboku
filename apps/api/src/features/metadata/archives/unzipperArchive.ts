import fs from "node:fs"
import type { Archive } from "@prose-reader/archive-reader"
import { createArchiveFromUnzipper } from "@prose-reader/archive-reader/archives/createArchiveFromUnzipper"
import unzipper from "unzipper"

const basename = (uri: string): string =>
  uri.split(/[\\/]/).filter(Boolean).pop() ?? uri

/**
 * The end-of-central-directory record, APPNOTE.TXT section 4.3.16
 * (https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT).
 */
const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50
const END_OF_CENTRAL_DIRECTORY_SIZE = 22
const COMMENT_LENGTH_OFFSET = 20
const MAX_COMMENT_LENGTH = 0xffff
const MAX_END_OF_CENTRAL_DIRECTORY_SIZE =
  END_OF_CENTRAL_DIRECTORY_SIZE + MAX_COMMENT_LENGTH

const readTail = async (filePath: string) => {
  const file = await fs.promises.open(filePath)

  try {
    const { size: fileSize } = await file.stat()
    const tailLength = Math.min(fileSize, MAX_END_OF_CENTRAL_DIRECTORY_SIZE)
    const { buffer: tail } = await file.read({
      buffer: Buffer.alloc(tailLength),
      position: fileSize - tailLength,
    })

    return tail
  } finally {
    await file.close()
  }
}

/**
 * The length of the end-of-central-directory record, comment included: the
 * last signature whose comment ends exactly at the end of the file. A
 * signature that stored data happens to hold does not end there.
 */
const getEndOfCentralDirectoryLength = async (filePath: string) => {
  const tail = await readTail(filePath)

  for (
    let offset = tail.length - END_OF_CENTRAL_DIRECTORY_SIZE;
    offset >= 0;
    offset--
  ) {
    const isSignature =
      tail.readUInt32LE(offset) === END_OF_CENTRAL_DIRECTORY_SIGNATURE
    const recordLength =
      END_OF_CENTRAL_DIRECTORY_SIZE +
      tail.readUInt16LE(offset + COMMENT_LENGTH_OFFSET)
    const isRecordEndingAtEndOfFile = offset + recordLength === tail.length

    if (isSignature && isRecordEndingAtEndOfFile) return recordLength
  }

  throw new Error(`No end of central directory record found in ${filePath}`)
}

/**
 * `unzipper.Open.file` gives random access through the central directory, so
 * an entry is decoded only when it is read.
 */
export const createUnzipperArchiveSource = async (
  filePath: string,
  {
    name = basename(filePath),
    encodingFormat,
  }: { name?: string; encodingFormat?: string } = {},
): Promise<Archive> => {
  const directory = await unzipper.Open.file(filePath, {
    tailSize: await getEndOfCentralDirectoryLength(filePath),
  })

  return createArchiveFromUnzipper(directory, { name, encodingFormat })
}
