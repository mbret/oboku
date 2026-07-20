import { createWorkerPool } from "../../../workers/pool/createWorkerPool"
import type {
  ImageCompressionRequest,
  ImageCompressionResponse,
} from "./imageCompression.types"

export type CompressionResult = ImageCompressionResponse

export type ImageCompressionPool = {
  compress: (
    bytes: ArrayBuffer,
    maxWidth: number | undefined,
    maxHeight: number | undefined,
  ) => Promise<CompressionResult>
  terminate: () => void
}

export const createImageCompressionPool = (): ImageCompressionPool => {
  const pool = createWorkerPool<
    ImageCompressionRequest,
    ImageCompressionResponse
  >({
    createWorker: () =>
      new Worker(new URL("./imageCompression.worker.ts", import.meta.url), {
        type: "module",
      }),
  })

  return {
    compress: (bytes, maxWidth, maxHeight) =>
      pool.run({ bytes, maxWidth, maxHeight }, [bytes]),
    terminate: pool.terminate,
  }
}
