// @vitest-environment jsdom

import type { CoreInputSettings } from "@prose-reader/core"
import { renderHook } from "@testing-library/react"
import { SIGNAL_RESET } from "reactjrx"
import { Subject } from "rxjs"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  type LocalSettings,
  localSettingsSignal,
} from "../../settings/useLocalSettings"

type SpreadModeSetting = Pick<CoreInputSettings, "spreadMode">

type FakeReader = {
  settings: { watch: (keys: "spreadMode"[]) => Subject<SpreadModeSetting> }
}

const mocks = vi.hoisted(function createSpreadModeMocks() {
  const state: { reader?: FakeReader } = {}

  return { state }
})

vi.mock("../states", function mockReaderState() {
  return {
    useReader: function useMockReader() {
      return mocks.state.reader
    },
  }
})

import { usePersistSpreadMode } from "./spreadMode"

function createFakeReader() {
  const spreadModeSetting$ = new Subject<SpreadModeSetting>()

  mocks.state.reader = {
    settings: {
      watch: function watchSpreadMode() {
        return spreadModeSetting$
      },
    },
  }

  return spreadModeSetting$
}

describe("usePersistSpreadMode", () => {
  beforeEach(function resetDeviceSettings() {
    localSettingsSignal.update(SIGNAL_RESET)
  })

  it("saves the spread mode the reader switches to, keeping the other device settings", () => {
    localSettingsSignal.update(function withDarkTheme(settings): LocalSettings {
      return { ...settings, themeMode: "dark" }
    })
    const spreadModeSetting$ = createFakeReader()
    renderHook(usePersistSpreadMode)

    spreadModeSetting$.next({ spreadMode: "always" })

    expect(localSettingsSignal.getValue()).toMatchObject({
      readerSpreadMode: "always",
      themeMode: "dark",
    })
  })

  it("saves nothing once unmounted", () => {
    const spreadModeSetting$ = createFakeReader()
    const { unmount } = renderHook(usePersistSpreadMode)

    unmount()
    spreadModeSetting$.next({ spreadMode: "never" })

    expect(localSettingsSignal.getValue().readerSpreadMode).toBe("auto")
  })
})
