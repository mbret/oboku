/// <reference types="@vitest/browser-playwright" />
import type { Theme } from "@prose-reader/core"
import type { Manifest } from "@prose-reader/shared"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, cleanup, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { SIGNAL_RESET, signal, useSignalValue } from "reactjrx"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { cdp } from "vitest/browser"
import {
  type LocalSettings,
  localSettingsSignal,
} from "../../settings/useLocalSettings"

const mocks = vi.hoisted(function createReaderMocks() {
  return {
    createAppReader: vi.fn(function createFakeReader(_options: {
      manifest?: Manifest
      theme?: Theme
    }) {
      return {
        mount: vi.fn(),
        destroy: vi.fn(),
        theme: { set: vi.fn<(theme: Theme) => void>() },
      }
    }),
  }
})

vi.mock("../createAppReader", function mockCreateAppReader() {
  return { createAppReader: mocks.createAppReader }
})

vi.mock("../streamer/webStreamer", function mockWebStreamer() {
  return { webStreamer: { prune: vi.fn() } }
})

import { useCreateReader } from "../useCreateReader"
import { useSyncReaderTheme } from "./useReaderTheme"

type DeviceColorScheme = "light" | "dark"

const createManifest = (filename: string): Manifest => ({
  filename,
  mediaType: "application/epub+zip",
  title: filename,
  renditionLayout: "reflowable",
  renditionSpread: undefined,
  readingDirection: "ltr",
  spineItems: [],
  items: [],
})

const firstBook = { bookId: "first-book", manifest: createManifest("first") }
const secondBook = { bookId: "second-book", manifest: createManifest("second") }

const openBookSignal = signal<{ bookId: string; manifest?: Manifest }>({
  key: "openBookInTest",
  default: firstBook,
})

function emulateDeviceColorScheme(colorScheme: DeviceColorScheme) {
  return cdp().send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-color-scheme", value: colorScheme }],
  })
}

function updateThemeMode(themeMode: LocalSettings["themeMode"]) {
  localSettingsSignal.update(function withThemeMode(settings): LocalSettings {
    return { ...settings, themeMode }
  })
}

function setThemeMode(themeMode: LocalSettings["themeMode"]) {
  act(function changeThemeSetting() {
    updateThemeMode(themeMode)
  })
}

function openSecondBook() {
  act(function openNextBook() {
    openBookSignal.update(secondBook)
  })
}

function getCreatedReaders() {
  return mocks.createAppReader.mock.results.map((result) => result.value)
}

function getCreationThemes() {
  return mocks.createAppReader.mock.calls.map(([options]) => options.theme)
}

function hasThemeSetAfterDestroy(
  reader: ReturnType<typeof mocks.createAppReader>,
) {
  const destroyedAt =
    reader.destroy.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY

  return reader.theme.set.mock.invocationCallOrder.some(
    (calledAt) => calledAt > destroyedAt,
  )
}

function renderReaderEffects() {
  const queryClient = new QueryClient()
  const containerRef = { current: document.createElement("div") }

  return renderHook(
    function renderCreateAndSyncReader() {
      const { bookId, manifest } = useSignalValue(openBookSignal)

      useCreateReader({
        bookId,
        manifest,
        containerRef,
        isPreview: true,
        isUsingWebStreamer: false,
      })
      useSyncReaderTheme()
    },
    {
      wrapper: function QueryClientWrapper({
        children,
      }: {
        children: ReactNode
      }) {
        return (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        )
      },
    },
  )
}

describe("the reader's theme", () => {
  beforeEach(async function startOnALightDeviceWithNoReader() {
    localSettingsSignal.update(SIGNAL_RESET)
    openBookSignal.update(SIGNAL_RESET)
    mocks.createAppReader.mockClear()
    await emulateDeviceColorScheme("light")
  })

  afterEach(function unmountReaderEffects() {
    cleanup()
  })

  afterEach(async function restoreLightDeviceForLaterFiles() {
    await emulateDeviceColorScheme("light")
  })

  it.each<{
    themeMode: LocalSettings["themeMode"]
    deviceColorScheme: DeviceColorScheme
    theme: Theme
  }>([
    { themeMode: "dark", deviceColorScheme: "light", theme: "night" },
    { themeMode: "light", deviceColorScheme: "dark", theme: "bright" },
    { themeMode: "system", deviceColorScheme: "dark", theme: "night" },
    { themeMode: "system", deviceColorScheme: "light", theme: "bright" },
    { themeMode: "e-ink", deviceColorScheme: "dark", theme: "bright" },
  ])(
    "creates the reader in $theme when the app is in $themeMode on a $deviceColorScheme device",
    async ({ themeMode, deviceColorScheme, theme }) => {
      await emulateDeviceColorScheme(deviceColorScheme)
      setThemeMode(themeMode)

      renderReaderEffects()

      expect(getCreationThemes()).toEqual([theme])
    },
  )

  it("follows a change of the theme setting with the same reader", () => {
    setThemeMode("light")
    renderReaderEffects()

    setThemeMode("dark")

    const [reader] = getCreatedReaders()

    expect({
      creationThemes: getCreationThemes(),
      lastThemeSet: reader?.theme.set.mock.lastCall,
    }).toEqual({ creationThemes: ["bright"], lastThemeSet: ["night"] })
  })

  it("follows the device's color scheme when the app is in system mode", async () => {
    setThemeMode("system")
    renderReaderEffects()

    await emulateDeviceColorScheme("dark")

    const [reader] = getCreatedReaders()

    await waitFor(function expectNightTheme() {
      expect(reader?.theme.set).toHaveBeenLastCalledWith("night")
    })
    expect(getCreationThemes()).toEqual(["bright"])
  })

  it("creates the next book's reader in the theme the app switched to", () => {
    setThemeMode("light")
    renderReaderEffects()
    setThemeMode("dark")

    openSecondBook()

    const [firstReader] = getCreatedReaders()

    expect({
      creationThemes: getCreationThemes(),
      lastCreatedManifest: mocks.createAppReader.mock.lastCall?.[0].manifest,
      firstReaderDestroyCalls: firstReader?.destroy.mock.calls.length,
    }).toEqual({
      creationThemes: ["bright", "night"],
      lastCreatedManifest: secondBook.manifest,
      firstReaderDestroyCalls: 1,
    })
  })

  it("sets a theme change on the open reader only", () => {
    setThemeMode("light")
    renderReaderEffects()
    openSecondBook()

    setThemeMode("dark")

    const [firstReader, secondReader] = getCreatedReaders()

    expect({
      isFirstReaderSetAfterDestroy:
        firstReader && hasThemeSetAfterDestroy(firstReader),
      secondReaderLastThemeSet: secondReader?.theme.set.mock.lastCall,
    }).toEqual({
      isFirstReaderSetAfterDestroy: false,
      secondReaderLastThemeSet: ["night"],
    })
  })

  it.each<{
    change: string
    nextBook: { bookId: string; manifest?: Manifest }
    creationThemes: Theme[]
  }>([
    {
      change: "the next book opens",
      nextBook: secondBook,
      creationThemes: ["bright", "night"],
    },
    {
      change: "the book closes",
      nextBook: { bookId: "no-book" },
      creationThemes: ["bright"],
    },
  ])(
    "leaves the closed reader alone when the theme changes as $change",
    ({ nextBook, creationThemes }) => {
      setThemeMode("light")
      renderReaderEffects()

      act(function changeBookAndThemeTogether() {
        updateThemeMode("dark")
        openBookSignal.update(nextBook)
      })

      expect({
        creationThemes: getCreationThemes(),
        readersSetAfterDestroy: getCreatedReaders().filter(
          hasThemeSetAfterDestroy,
        ).length,
      }).toEqual({ creationThemes, readersSetAfterDestroy: 0 })
    },
  )
})
