const decodeFileName = (value: string) => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

/** RFC 6266 §4.1: a quoted-string may hold `;`, and escapes `"` and `\` with `\`. */
const QUOTED_FILE_NAME = /filename\s*=\s*"((?:\\.|[^"\\])*)"/i
const QUOTED_PAIR = /\\(.)/g
const TOKEN_FILE_NAME = /filename\s*=\s*([^";]+)/i

export const getFileNameFromContentDisposition = (
  contentDisposition?: string,
) => {
  if (!contentDisposition) {
    return undefined
  }

  const utf8Match = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)

  if (utf8Match?.[1]) {
    return decodeFileName(utf8Match[1].trim())
  }

  const quotedMatch = contentDisposition.match(QUOTED_FILE_NAME)
  const quotedFileName = quotedMatch?.[1]?.replace(QUOTED_PAIR, "$1").trim()

  if (quotedFileName) {
    return decodeFileName(quotedFileName)
  }

  const tokenMatch = contentDisposition.match(TOKEN_FILE_NAME)

  if (tokenMatch?.[1]) {
    return decodeFileName(tokenMatch[1].trim())
  }

  return undefined
}

export const getFileNameFromUrl = (url: string) => {
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
