const BLOCK_ELEMENTS = "p, div, li, blockquote, h1, h2, h3, h4, h5, h6, tr"

/** HTML's whitespace, which a non-breaking space is not part of. */
const HTML_WHITESPACE = /[ \t\n\f\r]+/g

/**
 * A description as plain text, paragraphs on their own lines. Google Books
 * and EPUB packages (calibre writes its comments there) state descriptions
 * in HTML.
 */
export const getDescriptionText = (description: string) => {
  const { body } = new DOMParser().parseFromString(description, "text/html")
  const isHtml = body.childElementCount > 0

  if (!isHtml) return (body.textContent ?? "").trim()

  const textNodes = body.ownerDocument.createTreeWalker(
    body,
    NodeFilter.SHOW_TEXT,
  )

  for (let node = textNodes.nextNode(); node; node = textNodes.nextNode()) {
    node.textContent = (node.textContent ?? "").replace(HTML_WHITESPACE, " ")
  }

  for (const lineBreak of body.querySelectorAll("br")) {
    lineBreak.replaceWith("\n")
  }

  for (const block of body.querySelectorAll(BLOCK_ELEMENTS)) {
    block.append("\n\n")
  }

  return (body.textContent ?? "")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}
