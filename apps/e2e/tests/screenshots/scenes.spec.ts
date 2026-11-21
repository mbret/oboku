import path from "node:path"
import type { Locator, Page } from "@playwright/test"
import { expect, test } from "../../src/fixtures"
import {
  LITTLE_NEMO,
  SERVER_LIBRARY_BOOKS,
  THE_TIME_MACHINE,
  TREASURE_ISLAND,
} from "../../src/library"
import {
  addServerLibrary,
  downloadServerBook,
  LIBRARY_SYNC_TIMEOUT_MS,
  signUp,
} from "../../src/steps"

type SceneName =
  | "home"
  | "library"
  | "book-details"
  | "epub-reader"
  | "comic-reader"

/** The address of each book's details screen, by title. */
type BookDetailsUrls = ReadonlyMap<string, string>

type Target = {
  name: string
  viewport: { width: number; height: number }
  deviceScaleFactor: number
  colorScheme: "light" | "dark"
  locale: string
  /** The scenes this target captures, in order, and where each is saved. */
  captures: { scene: SceneName; outputPath: string }[]
}

const WEB_PUBLIC_DIR = path.join(import.meta.dirname, "../../../web/public")
const PLAY_DIR = path.join(import.meta.dirname, "../../screenshots/play-phone")

const TARGETS: Target[] = [
  {
    name: "play-phone",
    viewport: { width: 360, height: 640 },
    deviceScaleFactor: 3,
    colorScheme: "light",
    locale: "en-US",
    captures: [
      { scene: "home", outputPath: path.join(PLAY_DIR, "en", "home.png") },
      {
        scene: "library",
        outputPath: path.join(PLAY_DIR, "en", "library.png"),
      },
      {
        scene: "book-details",
        outputPath: path.join(PLAY_DIR, "en", "book-details.png"),
      },
      {
        scene: "epub-reader",
        outputPath: path.join(PLAY_DIR, "en", "epub-reader.png"),
      },
      {
        scene: "comic-reader",
        outputPath: path.join(PLAY_DIR, "en", "comic-reader.png"),
      },
    ],
  },
  {
    name: "web-manifest",
    viewport: { width: 320, height: 568 },
    deviceScaleFactor: 2,
    colorScheme: "light",
    locale: "en-US",
    captures: [
      {
        scene: "home",
        outputPath: path.join(WEB_PUBLIC_DIR, "app.oboku.me_(iPhone 5_SE).png"),
      },
      {
        scene: "library",
        outputPath: path.join(
          WEB_PUBLIC_DIR,
          "app.oboku.me_(iPhone 5_SE) (1).png",
        ),
      },
      {
        scene: "epub-reader",
        outputPath: path.join(
          WEB_PUBLIC_DIR,
          "app.oboku.me_(iPhone 5_SE) (2).png",
        ),
      },
    ],
  },
]

/** Every library book is on screen at this size, for the setup. */
const SETUP_VIEWPORT = { width: 1280, height: 800 }

/**
 * The clock reads this time when each scene starts, and keeps running: the
 * app's timers measure time with Date.now, so a stopped clock stalls them.
 */
const CAPTURE_TIME = new Date("2026-11-02T09:41:00Z")

type PreparedLibrary = {
  bookDetailsUrls: BookDetailsUrls
  theTimeMachineReaderUrl: string
  littleNemoReaderUrl: string
}

function chapterOneFrameOfTheTimeMachine(page: Page) {
  return page.locator('iframe[src$="/epub/text/chapter-1.xhtml"]')
}

function chapterOneOfTheTimeMachine(page: Page) {
  return chapterOneFrameOfTheTimeMachine(page)
    .contentFrame()
    .getByText("The Time Traveller (for so it will be convenient")
}

function firstComicPageFrame(page: Page) {
  return page.locator("iframe").first()
}

function firstComicPage(page: Page) {
  return firstComicPageFrame(page).contentFrame().locator("img")
}

/** prose-reader fades each page in, whatever the reduced motion setting. */
async function expectFadedIn(readerPageFrame: Locator) {
  await expect(readerPageFrame).toHaveCSS("opacity", "1")
}

const SCENES: Record<
  SceneName,
  (page: Page, library: PreparedLibrary) => Promise<void>
> = {
  home: async function showHome(page) {
    await page.goto("/")
    const continueReadingSection = page
      .getByRole("heading", { name: "Continue reading" })
      .locator("..")

    for (const book of [LITTLE_NEMO, THE_TIME_MACHINE]) {
      await expect(
        continueReadingSection.getByText(book.title, { exact: true }),
      ).toBeVisible()
    }
  },
  library: async function showLibrary(page) {
    await page.goto("/library/books")
    await expect(
      page.getByText(LITTLE_NEMO.title, { exact: true }),
    ).toBeVisible()
  },
  "book-details": async function showBookDetails(page, library) {
    await page.goto(
      detailsUrlOf(library.bookDetailsUrls, TREASURE_ISLAND.title),
    )
    await expect(
      page.getByRole("button", { name: "Read", exact: true }),
    ).toBeVisible()
  },
  "epub-reader": async function showEpubReader(page, library) {
    await page.goto(library.theTimeMachineReaderUrl)
    await expect(chapterOneOfTheTimeMachine(page)).toBeVisible()
    await expectFadedIn(chapterOneFrameOfTheTimeMachine(page))
  },
  "comic-reader": async function showComicReader(page, library) {
    await page.goto(library.littleNemoReaderUrl)
    await expect(firstComicPage(page)).toBeVisible()
    await expectFadedIn(firstComicPageFrame(page))
  },
}

function detailsUrlOf(bookDetailsUrls: BookDetailsUrls, title: string) {
  const bookDetailsUrl = bookDetailsUrls.get(title)

  if (!bookDetailsUrl) {
    throw new Error(`"${title}" was not downloaded during the setup`)
  }

  return bookDetailsUrl
}

async function downloadServerLibrary(page: Page): Promise<BookDetailsUrls> {
  await page.goto("/library/books")
  await expect(page.getByText(LITTLE_NEMO.title, { exact: true })).toBeVisible({
    timeout: LIBRARY_SYNC_TIMEOUT_MS,
  })

  const bookDetailsUrls = new Map<string, string>()

  for (const book of SERVER_LIBRARY_BOOKS) {
    bookDetailsUrls.set(book.title, await downloadServerBook(page, book.title))
  }

  return bookDetailsUrls
}

/** Opens the reader from a book's details screen and returns its address. */
async function readFromDetailsScreen(page: Page) {
  await page.getByRole("button", { name: "Read", exact: true }).click()
  await page.waitForURL(/\/reader\//)

  return page.url()
}

/**
 * Waits, from a second tab, until the library card of the book open in
 * `page` shows `savedProgress`. The reader saves the reading position about
 * once a second, and leaving it sooner can lose the position.
 */
async function waitForSavedReadingProgress(
  page: Page,
  title: string,
  savedProgress: RegExp,
) {
  const libraryTab = await page.context().newPage()

  await libraryTab.goto("/library/books")
  const bookCard = libraryTab
    .locator("div")
    .filter({ has: libraryTab.getByText(title, { exact: true }) })
    .filter({ has: libraryTab.getByText(savedProgress) })
    .last()

  await expect(bookCard).toBeVisible()
  await libraryTab.close()
}

/**
 * The first full page load after a book was opened offers to go back to it,
 * over the screen. Declining stops the offer until a book is opened again.
 */
async function declineBackToReading(page: Page) {
  await page
    .getByRole("dialog", { name: "Take me back to my book" })
    .getByRole("button", { name: "Cancel" })
    .click()
}

const anyProgress = /^\d+%$/
const progressPastTheFirstPercent = /^([2-9]|\d{2,})%$/

/**
 * Puts The Time Machine on its first chapter and opens the comic, so Home
 * shows both as books in progress.
 */
async function startReading(
  page: Page,
  bookDetailsUrls: BookDetailsUrls,
): Promise<PreparedLibrary> {
  await page.goto(detailsUrlOf(bookDetailsUrls, THE_TIME_MACHINE.title))
  const theTimeMachineReaderUrl = await readFromDetailsScreen(page)
  await expect(
    page
      .frameLocator('iframe[src$="/epub/text/titlepage.xhtml"]')
      .getByRole("img", { name: THE_TIME_MACHINE.titlePageImageName }),
  ).toBeVisible()

  const viewport = page.viewportSize()

  if (!viewport) {
    throw new Error("The page has no viewport")
  }

  await page.mouse.click(viewport.width / 2, viewport.height / 2)
  await page.getByRole("button", { name: "Table of contents" }).click()
  await page.getByRole("button", { name: "I", exact: true }).click()
  await expect(chapterOneOfTheTimeMachine(page)).toBeVisible()
  await waitForSavedReadingProgress(
    page,
    THE_TIME_MACHINE.title,
    progressPastTheFirstPercent,
  )

  await page.goto(detailsUrlOf(bookDetailsUrls, LITTLE_NEMO.title))
  await declineBackToReading(page)
  const littleNemoReaderUrl = await readFromDetailsScreen(page)
  await expect(firstComicPage(page)).toBeVisible()
  await waitForSavedReadingProgress(page, LITTLE_NEMO.title, anyProgress)

  await page.goto("/")
  await declineBackToReading(page)

  return { bookDetailsUrls, theTimeMachineReaderUrl, littleNemoReaderUrl }
}

async function markNotificationsAsRead(page: Page) {
  await page.goto("/profile/notifications")
  const markAllAsReadButton = page.getByRole("button", {
    name: "Mark all read",
  })

  await markAllAsReadButton.click()
  await expect(markAllAsReadButton).toBeDisabled()
}

/**
 * The splash screen shows the logo, as the headings "o" and "boku", and fades
 * out once the app is ready.
 */
async function waitForScreenToSettle(page: Page) {
  await expect(
    page.getByRole("heading", { name: "boku", exact: true }),
  ).toHaveCount(0)
  await page.waitForFunction(async function areFontsAndImagesLoaded() {
    await document.fonts.ready

    return Array.from(document.images).every((image) => image.complete)
  })
}

for (const target of TARGETS) {
  test.describe(target.name, () => {
    test.use({
      viewport: SETUP_VIEWPORT,
      deviceScaleFactor: target.deviceScaleFactor,
      isMobile: true,
      hasTouch: true,
      colorScheme: target.colorScheme,
      locale: target.locale,
      timezoneId: "UTC",
    })

    /**
     * Store screenshots show the installed app, whose storage the browser
     * keeps. Headless Chromium never keeps it, and the app would then show an
     * unread notification about it.
     */
    test.beforeEach(async function simulateInstalledAppStorage({ context }) {
      await context.addInitScript(function reportStorageAsPersisted() {
        navigator.storage.persisted = async function persisted() {
          return true
        }
      })
    })

    test(`captures the ${target.name} screenshots`, async ({
      page,
      signUpInvitation,
    }) => {
      test.setTimeout(300_000)

      await signUp(page, signUpInvitation)
      await addServerLibrary(page)
      const bookDetailsUrls = await downloadServerLibrary(page)
      await markNotificationsAsRead(page)

      await page.setViewportSize(target.viewport)
      const library = await startReading(page, bookDetailsUrls)

      for (const { scene, outputPath } of target.captures) {
        await page.clock.setSystemTime(CAPTURE_TIME)
        await SCENES[scene](page, library)
        await waitForScreenToSettle(page)
        await page.screenshot({ path: outputPath })
      }
    })
  })
}
