import type { Locator, Page } from "@playwright/test"
import { expect } from "./fixtures"

/**
 * The reader page that shows the book document whose path ends with
 * `documentPath`, once the service worker streams the book.
 */
export function readerPage(page: Page, documentPath: string) {
  return page.locator(`iframe[src$="${documentPath}"]`)
}

/**
 * prose-reader adds the pages in reading order. Some pages load from `blob:`
 * addresses, which name no file of the book: a comic's, and any book's that
 * opens before the service worker controls the page.
 */
export function firstReaderPage(page: Page) {
  return page.locator("iframe").first()
}

/**
 * prose-reader keeps a page at opacity 0 until it is ready, then fades it in
 * over 800 ms, whatever the reduced motion setting.
 */
export async function expectReaderPageRevealed(readerPageFrame: Locator) {
  await expect(readerPageFrame).toHaveCSS("opacity", "1")
}

/** A tap in the middle of the page shows the reader's menu. */
export async function showReaderMenu(page: Page) {
  const viewport = page.viewportSize()

  if (!viewport) {
    throw new Error("The reader menu needs a page with a viewport")
  }

  await page.mouse.click(viewport.width / 2, viewport.height / 2)
}
