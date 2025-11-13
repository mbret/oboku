import JSZip from "jszip"

export type StreamValue = {
  baseUri: string
  response: Response
  progress: number
}

export const createCbzFromReadableStream = async (
  stream: ReadableStream<StreamValue>,
  { onData }: { onData: (value: StreamValue) => void },
) => {
  const reader = stream.getReader()

  try {
    const zip = new JSZip()

    await processValue(reader, zip, onData)

    reader.cancel()

    const data = await zip.generateAsync({
      type: `blob`,
      mimeType: `application/x-cbz`,
    })

    return data
  } catch (e) {
    // cancel in case of
    reader.cancel().catch(() => {})

    throw e
  }
}

const processValue = async (
  reader: ReadableStreamDefaultReader<StreamValue>,
  zip: JSZip,
  onData: (data: StreamValue) => void,
): Promise<void> => {
  const { done, value } = await reader.read()
  if (done) {
    return
  }

  if (value) {
    const { baseUri, response } = value
    zip.file(baseUri, await response.blob(), {})
    onData(value)
  }

  if (!done) {
    await processValue(reader, zip, onData)
  }
}
