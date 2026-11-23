import fs from "node:fs"
import { createArchiveFromNodeUnrarJs } from "@prose-reader/archive-reader/archives/createArchiveFromNodeUnrarJs"
import { createExtractorFromData } from "node-unrar-js"

/**
 * node-unrar-js reads the archive from the start of the `ArrayBuffer` it gets,
 * but Node reads a small file into its shared Buffer pool, where the file can
 * start further in.
 */
const toArrayBuffer = (file: NonSharedBuffer): ArrayBuffer => {
  const spansWholeArrayBuffer =
    file.byteOffset === 0 && file.byteLength === file.buffer.byteLength

  return spansWholeArrayBuffer
    ? file.buffer
    : file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength)
}

const wasmBinary = toArrayBuffer(
  fs.readFileSync(
    new URL(import.meta.resolve("node-unrar-js/esm/js/unrar.wasm")),
  ),
)

export const getRarArchive = async (
  filePath: string,
  options: { name?: string; encodingFormat?: string } = {},
) => {
  const extractor = await createExtractorFromData({
    data: toArrayBuffer(await fs.promises.readFile(filePath)),
    wasmBinary,
  })

  return createArchiveFromNodeUnrarJs(extractor, options)
}
