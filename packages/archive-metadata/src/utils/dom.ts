export type XmlDocument = Document
export type XmlElement = Element

export const parseXml = (xml: string, label: string): XmlDocument => {
  const Parser = globalThis.DOMParser

  if (!Parser) {
    throw new Error("XML writing requires a DOMParser-compatible web runtime.")
  }

  const doc = new Parser().parseFromString(xml, "application/xml")
  const parserError = doc.getElementsByTagName("parsererror").item(0)

  if (parserError) {
    const message = parserError.textContent?.trim()

    throw new Error(
      message ? `${label} is malformed: ${message}` : `${label} is malformed`,
    )
  }

  return doc
}

export const serializeXml = (doc: XmlDocument | XmlElement): string => {
  const Serializer = globalThis.XMLSerializer

  if (!Serializer) {
    throw new Error(
      "XML writing requires an XMLSerializer-compatible web runtime.",
    )
  }

  return new Serializer().serializeToString(doc)
}

/**
 * Ensures a single child element with the given tag exists and carries
 * `value` as its text. `undefined`/empty removes the child entirely, so
 * writers can represent "clear this field" without a separate API.
 */
export const upsertChildElement = (
  doc: XmlDocument,
  parent: XmlElement,
  tagName: string,
  value: string | undefined,
): void => {
  const existing = parent.getElementsByTagName(tagName)[0]

  if (value === undefined || value === "") {
    if (existing) parent.removeChild(existing)

    return
  }

  if (existing) {
    existing.textContent = value
    return
  }

  const next = doc.createElement(tagName)
  next.textContent = value
  parent.appendChild(next)
}
