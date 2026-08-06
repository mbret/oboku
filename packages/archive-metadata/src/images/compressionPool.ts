import { createWorkerPool } from "../utils/workerPool/createWorkerPool"
import type {
  ImageCompressionOptions,
  ImageCompressionRequest,
  ImageCompressionResponse,
} from "./compression.types"

export type CompressionResult = ImageCompressionResponse

export type ImageCompressionPool = {
  compress: (
    bytes: ArrayBuffer,
    options: ImageCompressionOptions,
  ) => Promise<CompressionResult>
  terminate: () => void
}

export const createImageCompressionPool = (
  size: number,
): ImageCompressionPool => {
  const pool = createWorkerPool<
    ImageCompressionRequest,
    ImageCompressionResponse
  >({
    createWorker: () =>
      new Worker(new URL("./compression.worker.ts", import.meta.url), {
        type: "module",
      }),
    size,
  })

  return {
    compress: (bytes, options) => pool.run({ bytes, ...options }, [bytes]),
    terminate: pool.terminate,
  }
}
