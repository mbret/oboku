const BLOCK_ELEMENTS = "p, div, li, blockquote, h1, h2, h3, h4, h5, h6, tr"

/**
 * A description as plain text, paragraphs on their own lines. Google Books
 * and EPUB packages (calibre writes its comments there) state descriptions
 * in HTML.
 */
export const getDescriptionText = (description: string) => {
  const { body } = new DOMParser().parseFromString(description, "text/html")

  for (const lineBreak of body.querySelectorAll("br")) {
    lineBreak.replaceWith("\n")
  }

  for (const block of body.querySelectorAll(BLOCK_ELEMENTS)) {
    block.append("\n\n")
  }

  return (body.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim()
}
