import fs from "node:fs"
import { createArchiveFromNodeUnrarJs } from "@prose-reader/archive-reader/archives/createArchiveFromNodeUnrarJs"
import { createExtractorFromData } from "node-unrar-js"

/**
 * node-unrar-js reads the archive from the start of the `ArrayBuffer` it gets,
 * but Node reads a small file into its shared Buffer pool, where the file can
 * start further in.
 */
const readFileAsArrayBuffer = (path: string | URL): ArrayBuffer => {
  const file = fs.readFileSync(path)
  const spansWholeArrayBuffer =
    file.byteOffset === 0 && file.byteLength === file.buffer.byteLength

  return spansWholeArrayBuffer
    ? file.buffer
    : file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength)
}

const wasmBinary = readFileAsArrayBuffer(
  new URL(import.meta.resolve("node-unrar-js/esm/js/unrar.wasm")),
)

export const getRarArchive = async (filePath: string) => {
  const extractor = await createExtractorFromData({
    data: readFileAsArrayBuffer(filePath),
    wasmBinary,
  })

  return createArchiveFromNodeUnrarJs(extractor)
}
