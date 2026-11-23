import { readdir } from "node:fs/promises"
import path from "node:path"
import type { Page } from "@playwright/test"
import { expect, test } from "../../src/fixtures"
import {
  HITO_NO_ISSHO,
  LITTLE_NEMO,
  SERVER_LIBRARY_BOOKS,
  THE_TIME_MACHINE,
  THE_TIME_MACHINE_AUDIOBOOK,
  TREASURE_ISLAND,
} from "../../src/library"
import {
  expectFirstImagePage,
  expectReaderPageRevealed,
  firstAudioTrackWave,
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
  /** A drawer is a dialog. Any other dialog over the screen fails the capture. */
  showsDialog?: true
  /**
   * Undoes what `show` leaves behind over the next scene: a reader left open
   * makes the next full page load offer to go back to it. A reader scene still
   * leaves its book in progress.
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

async function showDataSources(page: Page) {
  await page.goto("/sync/datasources")
  await expect(page.getByText(/^Last synced at /)).toBeVisible()
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
  "manga-reader": {
    show: async function showMangaReader(page, bookDetailsUrls) {
      await openReaderOn(page, bookDetailsUrls, HITO_NO_ISSHO.title)
      await expectReaderPageRevealed(await expectFirstImagePage(page))
    },
    leave: closeReader,
  },
  "audiobook-reader": {
    show: async function showAudiobookReader(page, bookDetailsUrls) {
      await openReaderOn(
        page,
        bookDetailsUrls,
        THE_TIME_MACHINE_AUDIOBOOK.title,
      )
      await expectReaderPageRevealed(firstAudioTrackWave(page))
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
    show: showDataSources,
  },
  "add-data-source": {
    show: async function showAddDataSource(page) {
      await showDataSources(page)
      await page.getByRole("button", { name: "Add a new source" }).click()

      for (const provider of ["Google Drive", "Dropbox", "OneDrive"]) {
        await expect(page.getByRole("button", { name: provider })).toBeEnabled()
      }
    },
    showsDialog: true,
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
  outputDir: string
  /**
   * In capture order. A reader scene leaves its book in progress, so it comes
   * after the scenes that show reading progress.
   */
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
    scenes: [
      "home",
      "library",
      "book-details",
      "epub-reader",
      "manga-reader",
      "audiobook-reader",
    ],
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
      "library-e-ink",
      "book-details",
      "manage-storage",
      "data-sources",
      "add-data-source",
      "profile",
      "epub-reader",
      "manga-reader",
      "audiobook-reader",
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
 * Puts The Time Machine on its first chapter and opens Little Nemo, so Home
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
  await expectReaderPageRevealed(await expectChapterOneOfTheTimeMachine(page))
  await closeReader(page)

  await openReaderOn(page, bookDetailsUrls, LITTLE_NEMO.title)
  await expectReaderPageRevealed(await expectFirstImagePage(page))
  await closeReader(page)
}

async function waitForScreenToSettle(page: Page, scene: Scene) {
  // The splash screen's logo reads as the headings "o" and "boku".
  const splashScreenLogo = page.getByRole("heading", {
    name: "boku",
    exact: true,
  })

  await expect(splashScreenLogo).toHaveCount(0)
  await expect(page.getByRole("dialog")).toHaveCount(scene.showsDialog ? 1 : 0)
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
     * The screenshots show the installed app, whose storage the browser keeps.
     * Headless Chromium never keeps it, and the app would then show an unread
     * notification about it.
     */
    test.beforeEach(async function simulateInstalledAppStorage({ context }) {
      await context.addInitScript(function reportStorageAsPersisted() {
        // A new tab starts on a blank page, which has no storage.
        if (!window.isSecureContext) return

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
        await waitForScreenToSettle(page, sceneToCapture)
        await page.screenshot({
          path: path.join(target.outputDir, `${scene}.png`),
          animations: "disabled",
        })
        await sceneToCapture.leave?.(page)
      }

      const savedImages = await readdir(target.outputDir)
      const sceneImages = target.scenes.map((scene) => `${scene}.png`)

      expect(
        savedImages.filter((image) => image.endsWith(".png")).sort(),
        `${target.outputDir} holds only the images of the target's scenes`,
      ).toEqual(sceneImages.sort())
    })
  })
}
