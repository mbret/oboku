import path from "node:path"
import type { Page } from "@playwright/test"
import { expect, test } from "../../src/fixtures"
import {
  LITTLE_NEMO,
  SERVER_LIBRARY_BOOKS,
  THE_TIME_MACHINE,
  TREASURE_ISLAND,
} from "../../src/library"
import {
  expectReaderPageRevealed,
  firstReaderPage,
  readerPage,
  showReaderMenu,
} from "../../src/reader"
import {
  addServerLibrary,
  downloadFromDetailsScreen,
  expectServerLibraryBooks,
  openBookDetails,
  readFromDetailsScreen,
  signUp,
} from "../../src/steps"

type BookDetailsUrlsByTitle = ReadonlyMap<string, string>

type Scene = {
  show: (page: Page, bookDetailsUrls: BookDetailsUrlsByTitle) => Promise<void>
  /**
   * Undoes what `show` leaves behind that the next scene would show: a reader
   * left open makes the next full page load offer to go back to it.
   */
  leave?: (page: Page) => Promise<void>
}

/** Shows every library book at once: the library list renders only the books on screen. */
const SETUP_VIEWPORT = { width: 1280, height: 800 }

/**
 * The clock reads this time when each scene starts, and keeps running: the
 * app's timers measure time with Date.now, so a stopped clock stalls them.
 */
const CAPTURE_TIME = new Date("2026-11-02T09:41:00Z")

const TARGET_TIMEOUT_MS = 300_000

const APPS_DIR = path.join(import.meta.dirname, "../../..")

/** A library card shows 1% for a book at its start. */
const progressPastTheStart = /^([2-9]|\d{2,})%$/

function detailsUrlOf(bookDetailsUrls: BookDetailsUrlsByTitle, title: string) {
  const bookDetailsUrl = bookDetailsUrls.get(title)

  if (!bookDetailsUrl) {
    throw new Error(`"${title}" was not downloaded during the setup`)
  }

  return bookDetailsUrl
}

async function openReaderOn(
  page: Page,
  bookDetailsUrls: BookDetailsUrlsByTitle,
  title: string,
) {
  await page.goto(detailsUrlOf(bookDetailsUrls, title))
  await readFromDetailsScreen(page)
}

/**
 * Every full page load outside the reader offers to go back to the book open
 * in the reader, over the screen. Closing the reader in the app withdraws the
 * offer.
 */
async function closeReader(page: Page) {
  await page.goBack()
  await expect(
    page.getByRole("button", { name: "Read", exact: true }),
  ).toBeVisible()
}

function backToReadingDialog(page: Page) {
  return page.getByRole("dialog", { name: "Take me back to my book" })
}

async function declineBackToReading(page: Page) {
  await backToReadingDialog(page)
    .getByRole("button", { name: "Cancel" })
    .click()
}

async function expectChapterOneOfTheTimeMachine(page: Page) {
  const chapterOne = readerPage(page, THE_TIME_MACHINE.chapterOne.path)

  await expect(
    chapterOne.contentFrame().getByText(THE_TIME_MACHINE.chapterOne.opening),
  ).toBeVisible()

  return chapterOne
}

async function showLibrary(page: Page) {
  await page.goto("/library/books")
  await expect(page.getByText(LITTLE_NEMO.title, { exact: true })).toBeVisible()
}

/** For a list that renders only the books on screen, in no fixed order. */
function anyServerLibraryBookTitle(page: Page) {
  return SERVER_LIBRARY_BOOKS.map((book) =>
    page.getByText(book.title, { exact: true }),
  ).reduce((titles, title) => titles.or(title))
}

async function setColorMode(page: Page, colorMode: "E-ink" | "System") {
  await page.goto("/profile/settings")
  await page.getByRole("button", { name: /^Color mode/ }).click()
  await page.getByRole("button", { name: colorMode, exact: true }).click()
  await expect(
    page.getByRole("button", { name: `Color mode ${colorMode}` }),
  ).toBeVisible()
}

async function expectFirstPageOfLittleNemo(page: Page) {
  const firstPage = firstReaderPage(page)

  await expect(firstPage.contentFrame().locator("img")).toBeVisible()

  return firstPage
}

const SCENES = {
  home: {
    show: async function showHome(page) {
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
  },
  library: {
    show: showLibrary,
  },
  "library-e-ink": {
    show: async function showLibraryInEInk(page) {
      await setColorMode(page, "E-ink")
      await showLibrary(page)
    },
    leave: async function restoreColorMode(page) {
      await setColorMode(page, "System")
    },
  },
  "book-details": {
    show: async function showBookDetails(page, bookDetailsUrls) {
      await page.goto(detailsUrlOf(bookDetailsUrls, TREASURE_ISLAND.title))
      await expect(
        page.getByRole("button", { name: "Read", exact: true }),
      ).toBeVisible()
    },
  },
  "epub-reader": {
    show: async function showEpubReaderWithItsMenu(page, bookDetailsUrls) {
      await openReaderOn(page, bookDetailsUrls, THE_TIME_MACHINE.title)
      await expectReaderPageRevealed(
        await expectChapterOneOfTheTimeMachine(page),
      )
      await showReaderMenu(page)
      await expect(
        page.getByRole("button", { name: "Table of contents" }),
      ).toBeVisible()
    },
    leave: closeReader,
  },
  "manage-storage": {
    show: async function showManageStorage(page) {
      await page.goto("/profile/manage-storage")
      await expect(page.getByText(/ used of /)).toBeVisible()
      await expect(anyServerLibraryBookTitle(page).first()).toBeVisible()
    },
  },
  "data-sources": {
    show: async function showDataSources(page) {
      await page.goto("/sync/datasources")
      await expect(page.getByText(/^Last synced at /)).toBeVisible()
    },
  },
  "add-data-source": {
    show: async function showAddDataSource(page) {
      await page.goto("/sync/datasources")
      await page.getByRole("button", { name: "Add a new source" }).click()
      await expect(
        page.getByRole("button", { name: "Server files" }),
      ).toBeVisible()
    },
  },
  profile: {
    show: async function showProfile(page) {
      await page.goto("/profile")
      await expect(page.getByText("Sign out", { exact: true })).toBeVisible()
    },
  },
} satisfies Record<string, Scene>

type SceneName = keyof typeof SCENES

type Target = {
  name: string
  viewport: { width: number; height: number }
  deviceScaleFactor: number
  colorScheme: "light" | "dark"
  locale: string
  /** Each scene is saved there as `<scene>.png`. */
  outputDir: string
  /** The scenes this target captures, in order. */
  scenes: SceneName[]
}

const TARGETS: Target[] = [
  {
    name: "play-phone",
    viewport: { width: 360, height: 640 },
    deviceScaleFactor: 3,
    colorScheme: "light",
    locale: "en-US",
    outputDir: path.join(APPS_DIR, "e2e/screenshots/play-phone/en"),
    scenes: ["home", "library", "book-details", "epub-reader"],
  },
  {
    name: "web-manifest",
    viewport: { width: 320, height: 568 },
    deviceScaleFactor: 2,
    colorScheme: "light",
    locale: "en-US",
    outputDir: path.join(APPS_DIR, "web/public/manifest-screenshots"),
    scenes: ["home", "library", "epub-reader"],
  },
  {
    name: "landing",
    viewport: { width: 375, height: 667 },
    deviceScaleFactor: 2,
    colorScheme: "light",
    locale: "en-US",
    outputDir: path.join(
      APPS_DIR,
      "landing/src/features/common/app-screenshots",
    ),
    scenes: [
      "home",
      "library",
      "book-details",
      "epub-reader",
      "manage-storage",
      "data-sources",
      "add-data-source",
      "profile",
      "library-e-ink",
    ],
  },
]

async function downloadServerLibrary(
  page: Page,
): Promise<BookDetailsUrlsByTitle> {
  await page.goto("/library/books")
  await expectServerLibraryBooks(page)

  const bookDetailsUrls = new Map<string, string>()

  for (const book of SERVER_LIBRARY_BOOKS) {
    await openBookDetails(page, book.title)
    bookDetailsUrls.set(book.title, page.url())
    await downloadFromDetailsScreen(page)
    await page.goBack()
  }

  return bookDetailsUrls
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
 * Waits, from a second tab, until the library card of the book open in `page`
 * shows that the reader saved a position past the start. The reader saves the
 * position about once a second, and closing it sooner can lose the position.
 */
async function waitForSavedReadingProgress(page: Page, title: string) {
  const libraryTab = await page.context().newPage()

  await libraryTab.goto("/library/books")
  await declineBackToReading(libraryTab)
  const bookCard = libraryTab
    .locator("[data-book-card-container]")
    .filter({ has: libraryTab.getByText(title, { exact: true }) })

  await expect(bookCard.getByText(progressPastTheStart)).toBeVisible()
  await libraryTab.close()
}

/**
 * Puts The Time Machine on its first chapter and opens the comic, so Home
 * shows both as books in progress.
 */
async function startReading(
  page: Page,
  bookDetailsUrls: BookDetailsUrlsByTitle,
) {
  await openReaderOn(page, bookDetailsUrls, THE_TIME_MACHINE.title)
  await expect(
    readerPage(page, THE_TIME_MACHINE.titlePage.path)
      .contentFrame()
      .getByRole("img", { name: THE_TIME_MACHINE.titlePage.imageName }),
  ).toBeVisible()
  await showReaderMenu(page)
  await page.getByRole("button", { name: "Table of contents" }).click()
  await page.getByRole("button", { name: "I", exact: true }).click()
  await expectChapterOneOfTheTimeMachine(page)
  await waitForSavedReadingProgress(page, THE_TIME_MACHINE.title)
  await closeReader(page)

  await openReaderOn(page, bookDetailsUrls, LITTLE_NEMO.title)
  await expectFirstPageOfLittleNemo(page)
  await waitForSavedReadingProgress(page, LITTLE_NEMO.title)
  await closeReader(page)
}

async function waitForScreenToSettle(page: Page) {
  // The splash screen's logo reads as the headings "o" and "boku".
  const splashScreenLogo = page.getByRole("heading", {
    name: "boku",
    exact: true,
  })

  await expect(splashScreenLogo).toHaveCount(0)
  await expect(backToReadingDialog(page)).toHaveCount(0)
  // A cover shows a placeholder, and hides its picture, until its image loads.
  await page.waitForFunction(function areImagesShown() {
    const areImagesLoaded = Array.from(document.images).every(
      (image) => image.complete,
    )
    const areCoversShown = Array.from(
      document.querySelectorAll("picture"),
    ).every((picture) => getComputedStyle(picture).display !== "none")

    return areImagesLoaded && areCoversShown
  })
}

for (const target of TARGETS) {
  test.describe(target.name, () => {
    test.use({
      viewport: SETUP_VIEWPORT,
      deviceScaleFactor: target.deviceScaleFactor,
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
      test.setTimeout(TARGET_TIMEOUT_MS)

      await signUp(page, signUpInvitation)
      await addServerLibrary(page)
      const bookDetailsUrls = await downloadServerLibrary(page)
      await markNotificationsAsRead(page)

      await page.setViewportSize(target.viewport)
      await startReading(page, bookDetailsUrls)

      for (const scene of target.scenes) {
        const sceneToCapture: Scene = SCENES[scene]

        await page.clock.setSystemTime(CAPTURE_TIME)
        await sceneToCapture.show(page, bookDetailsUrls)
        await waitForScreenToSettle(page)
        await page.screenshot({
          path: path.join(target.outputDir, `${scene}.png`),
          animations: "disabled",
        })
        await sceneToCapture.leave?.(page)
      }
    })
  })
}
