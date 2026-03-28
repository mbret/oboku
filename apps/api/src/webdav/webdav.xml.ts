function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function encodeHrefPath(href: string): string {
  return href
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")
}

export type ResourceInfo = {
  href: string
  displayName: string
  isDirectory: boolean
  size: number
  lastModified: Date
  mimeType: string
  etag: string | null
}

export function buildMultiStatusXml(resources: ResourceInfo[]): string {
  const responses = resources.map((r) => {
    const props = [
      `<D:displayname>${escapeXml(r.displayName)}</D:displayname>`,
      r.isDirectory
        ? `<D:resourcetype><D:collection/></D:resourcetype>`
        : `<D:resourcetype/>`,
      `<D:getlastmodified>${r.lastModified.toUTCString()}</D:getlastmodified>`,
    ]

    if (!r.isDirectory) {
      props.push(
        `<D:getcontentlength>${r.size}</D:getcontentlength>`,
        `<D:getcontenttype>${escapeXml(r.mimeType)}</D:getcontenttype>`,
      )
    }

    if (r.etag) {
      props.push(`<D:getetag>${escapeXml(r.etag)}</D:getetag>`)
    }

    return [
      `  <D:response>`,
      `    <D:href>${escapeXml(encodeHrefPath(r.href))}</D:href>`,
      `    <D:propstat>`,
      `      <D:prop>`,
      ...props.map((p) => `        ${p}`),
      `      </D:prop>`,
      `      <D:status>HTTP/1.1 200 OK</D:status>`,
      `    </D:propstat>`,
      `  </D:response>`,
    ].join("\n")
  })

  return [
    `<?xml version="1.0" encoding="utf-8"?>`,
    `<D:multistatus xmlns:D="DAV:">`,
    ...responses,
    `</D:multistatus>`,
  ].join("\n")
}
