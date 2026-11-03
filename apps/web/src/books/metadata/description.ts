const BLOCK_ELEMENTS = "p, div, li, blockquote, h1, h2, h3, h4, h5, h6, tr"

/** HTML's whitespace, which a non-breaking space is not part of. */
const HTML_WHITESPACE = /[ \t\n\f\r]+/g

const CLOSING_TAG_OR_LINE_BREAK = /<\/[a-z]|<br\b/i

const parseHtmlBody = (value: string) =>
  new DOMParser().parseFromString(value, "text/html").body

const isHtmlElement = (element: Element) =>
  !(element instanceof HTMLUnknownElement)

/**
 * Plain text can hold a word in angle brackets, such as `<Dune>`, which a
 * browser takes for a tag and drops. A description is read as HTML only when
 * it closes a tag or breaks a line, and every tag in it is an HTML element.
 */
const isHtmlDescription = (description: string, body: HTMLElement) => {
  const elements = [...body.querySelectorAll("*")]

  return (
    CLOSING_TAG_OR_LINE_BREAK.test(description) &&
    elements.length > 0 &&
    elements.every(isHtmlElement)
  )
}

/**
 * A description as plain text, paragraphs on their own lines. Google Books
 * and EPUB packages (calibre writes its comments there) state descriptions
 * in HTML.
 */
export const getDescriptionText = (description: string) => {
  const body = parseHtmlBody(description)

  if (!isHtmlDescription(description, body)) {
    const plainText = parseHtmlBody(description.replaceAll("<", "&lt;"))

    return (plainText.textContent ?? "").trim()
  }

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
