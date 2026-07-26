import { createWorkerPool } from "../utils/workerPool/createWorkerPool"
import type {
  ImageCompressionRequest,
  ImageCompressionResponse,
} from "./compression.types"

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
      new Worker(new URL("./compression.worker.ts", import.meta.url), {
        type: "module",
      }),
  })

  return {
    compress: (bytes, maxWidth, maxHeight) =>
      pool.run({ bytes, maxWidth, maxHeight }, [bytes]),
    terminate: pool.terminate,
  }
}
