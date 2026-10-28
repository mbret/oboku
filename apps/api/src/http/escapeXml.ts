// XML 1.0 §2.2: the characters a document may hold, even as references.
const XML_FORBIDDEN_CHARACTERS = /[^\t\n\r -퟿-�\u{10000}-\u{10FFFF}]/gu

/**
 * Text safe in XML content and attribute values: markup characters are
 * escaped, and characters XML forbids become U+FFFD.
 */
export function escapeXml(value: string): string {
  return value
    .replace(XML_FORBIDDEN_CHARACTERS, "�")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
