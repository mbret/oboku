import { createWorkerPoolHandler } from "../utils/workerPool/createWorkerPoolHandler.worker"
import type {
  ImageCompressionRequest,
  ImageCompressionResponse,
} from "./compression.types"

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

const encodeCanvas = async (
  canvas: OffscreenCanvas,
  context: OffscreenCanvasRenderingContext2D,
  outputType: ImageCompressionRequest["outputType"],
): Promise<ArrayBuffer | undefined> => {
  if (outputType === "image/avif") {
    const { default: encodeAvif } = await import("@jsquash/avif/encode.js")

    return encodeAvif(context.getImageData(0, 0, canvas.width, canvas.height), {
      quality: 50,
      speed: 6,
    })
  }

  const blob = await canvas.convertToBlob({ type: outputType })

  return blob.type === outputType ? blob.arrayBuffer() : undefined
}

const compress = async ({
  bytes,
  maxWidth,
  maxHeight,
  outputType,
  skipIfUnscaled,
}: ImageCompressionRequest): Promise<ImageCompressionResponse> => {
  try {
    const bitmap = await createImageBitmap(new Blob([bytes]))
    const scale = computeScale(bitmap.width, bitmap.height, maxWidth, maxHeight)

    if (skipIfUnscaled && scale === 1) {
      bitmap.close()

      return { status: "skipped" }
    }

    const targetWidth = Math.max(1, Math.round(bitmap.width * scale))
    const targetHeight = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = new OffscreenCanvas(targetWidth, targetHeight)
    const context = canvas.getContext("2d", {
      colorSpace: "srgb",
      colorType: "unorm8",
    })

    if (!context) {
      bitmap.close()

      return { status: "skipped" }
    }

    context.drawImage(bitmap, 0, 0, targetWidth, targetHeight)
    bitmap.close()

    const output = await encodeCanvas(canvas, context, outputType)

    if (!output) return { status: "skipped" }

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
