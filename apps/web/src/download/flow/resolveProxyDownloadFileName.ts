import type { LinkDocType } from "@oboku/shared"

const fileNameFromPath = (path: string) => path.split("/").pop() || path

const fileNameFromUrl = (url: string) => {
  try {
    return new URL(url).pathname.split("/").filter(Boolean).pop() || url
  } catch {
    return url
  }
}

/**
 * Name to store a proxied download under. Derived from the link rather than a
 * response header because the API streams provider bytes without forwarding
 * the provider's own content-disposition.
 */
export const resolveProxyDownloadFileName = (
  link: Pick<LinkDocType, "_id" | "data">,
) => {
  const data: Record<string, unknown> = link.data ?? {}

  if (typeof data.filePath === "string") return fileNameFromPath(data.filePath)
  if (typeof data.url === "string") return fileNameFromUrl(data.url)

  return link._id
}
