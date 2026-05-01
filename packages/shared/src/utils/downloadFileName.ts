const decodeFileName = (value: string) => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const getFileNameFromContentDisposition = (contentDisposition?: string) => {
  if (!contentDisposition) {
    return undefined
  }

  const utf8Match = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)

  if (utf8Match?.[1]) {
    return decodeFileName(utf8Match[1].trim())
  }

  const fileNameMatch = contentDisposition.match(/filename\s*=\s*"?([^";]+)"?/i)

  if (fileNameMatch?.[1]) {
    return decodeFileName(fileNameMatch[1].trim())
  }

  return undefined
}

const getFileNameFromUrl = (url: string) => {
  try {
    const pathname = new URL(url).pathname
    const fileName = pathname.split("/").filter(Boolean).pop()

    return fileName ? decodeFileName(fileName) : undefined
  } catch {
    return undefined
  }
}

export const resolveDownloadFileName = ({
  contentDisposition,
  url,
}: {
  contentDisposition?: string
  url?: string
}) =>
  getFileNameFromContentDisposition(contentDisposition) ??
  (url ? getFileNameFromUrl(url) : undefined)
