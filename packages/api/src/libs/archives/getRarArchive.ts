import fs from "fs"
import { createExtractorFromData } from "node-unrar-js"

const wasmBinary = fs.readFileSync(
  require.resolve("node-unrar-js/esm/js/unrar.wasm")
)

export const getRarArchive = async (filePath: string) => {
  const buffer = fs.readFileSync(filePath)
  const extractor = await createExtractorFromData({
    data: buffer,
    wasmBinary
  })

  return extractor
}
