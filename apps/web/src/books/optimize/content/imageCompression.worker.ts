import { createWorkerPoolHandler } from "../../../workers/pool/createWorkerPoolHandler.worker"
import type {
  ImageCompressionRequest,
  ImageCompressionResponse,
} from "./imageCompression.types"

const computeScale = (
  width: number,
  height: number,
  maxWidth: number | undefined,
  maxHeight: number | undefined,
): number => {
  const widthScale = maxWidth && width > maxWidth ? maxWidth / width : 1
  const heightScale = maxHeight && height > maxHeight ? maxHeight / height : 1

  return Math.min(1, widthScale, heightScale)
}

const compress = async ({
  bytes,
  maxWidth,
  maxHeight,
}: ImageCompressionRequest): Promise<ImageCompressionResponse> => {
  try {
    const bitmap = await createImageBitmap(new Blob([bytes]))
    const scale = computeScale(bitmap.width, bitmap.height, maxWidth, maxHeight)
    const targetWidth = Math.max(1, Math.round(bitmap.width * scale))
    const targetHeight = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = new OffscreenCanvas(targetWidth, targetHeight)
    const context = canvas.getContext("2d")

    if (!context) {
      bitmap.close()

      return { status: "skipped" }
    }

    context.drawImage(bitmap, 0, 0, targetWidth, targetHeight)
    bitmap.close()

    const blob = await canvas.convertToBlob({ type: "image/webp" })
    const output = await blob.arrayBuffer()

    return { status: "ok", bytes: output }
  } catch {
    return { status: "skipped" }
  }
}

createWorkerPoolHandler<ImageCompressionRequest, ImageCompressionResponse>(
  async (request) => {
    const response = await compress(request)
    const transfer = response.status === "ok" ? [response.bytes] : []

    return { response, transfer }
  },
)
