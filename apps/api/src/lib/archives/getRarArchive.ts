import * as fs from "node:fs"
import { createExtractorFromData } from "node-unrar-js"

const wasmBinary = fs.readFileSync(
  require.resolve("node-unrar-js/esm/js/unrar.wasm"),
).buffer as ArrayBuffer

export const getRarArchive = async (filePath: string) => {
  const data = fs.readFileSync(filePath).buffer as ArrayBuffer
  const extractor = await createExtractorFromData({
    data,
    wasmBinary,
  })

  return extractor
}
