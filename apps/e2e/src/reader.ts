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
 * The first page prose-reader loaded, which is the book's first page when the
 * book opens at its start. Some pages load from `blob:` addresses, which name
 * no file of the book: a comic's, and any book's that opens before the service
 * worker controls the page.
 */
export function firstReaderPage(page: Page) {
  return page.locator("iframe").first()
}

/**
 * The wave of the first track prose-reader loaded, which is the book's first
 * track when the book opens at its start.
 */
export function firstAudioTrackWave(page: Page) {
  return page.locator("canvas").first()
}

/** The first page of a comic or a manga that opens at its start. */
export async function expectFirstImagePage(page: Page) {
  const firstPage = firstReaderPage(page)

  await expect(firstPage.contentFrame().locator("img")).toBeVisible()

  return firstPage
}

/**
 * prose-reader keeps a page's container at opacity 0 until the page is ready,
 * then fades it in over 800 ms, whatever the reduced motion setting
 * (mbret/prose-reader#892). The container is the iframe of a document page,
 * and an ancestor of the wave of an audio track.
 */
export async function expectReaderPageRevealed(readerPageContent: Locator) {
  await expect(readerPageContent).toBeVisible()
  await expect
    .poll(() =>
      readerPageContent.evaluate(function shownOpacity(element) {
        let opacity = 1

        for (
          let ancestor: Element | null = element;
          ancestor;
          ancestor = ancestor.parentElement
        ) {
          opacity *= Number(getComputedStyle(ancestor).opacity)
        }

        return opacity
      }),
    )
    .toBe(1)
}

/** A tap in the middle of the page shows the reader's menu. */
export async function showReaderMenu(page: Page) {
  const viewport = page.viewportSize()

  if (!viewport) {
    throw new Error("The reader menu needs a page with a viewport")
  }

  await page.mouse.click(viewport.width / 2, viewport.height / 2)
}
