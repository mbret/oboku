import { act, renderHook } from "@testing-library/react"
import { SIGNAL_RESET } from "reactjrx"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  type LocalSettings,
  localSettingsSignal,
} from "../../settings/useLocalSettings"

const mocks = vi.hoisted(function createAccountSettingsMocks() {
  const accountSettings: { readerGlobalFontScale?: number | null } = {}

  return { accountSettings }
})

vi.mock("../../settings/useSettings", function mockSettings() {
  return {
    useSettings: function useMockSettings() {
      return { data: mocks.accountSettings }
    },
  }
})

import { useReaderSettings } from "./useReaderSettings"

describe("useReaderSettings", () => {
  beforeEach(function resetDeviceAndAccountSettings() {
    localSettingsSignal.update(SIGNAL_RESET)
    mocks.accountSettings = {}
  })

  it("uses the account's font scale on a device that has not changed it", () => {
    mocks.accountSettings = { readerGlobalFontScale: 1.4 }

    const { result } = renderHook(useReaderSettings)

    expect(result.current.readerSettings.fontScale).toBe(1.4)
  })

  it("saves a change on the device, which then wins over the account's", () => {
    mocks.accountSettings = { readerGlobalFontScale: 1.4 }
    const { result } = renderHook(useReaderSettings)

    act(function changeFontScaleOnDevice() {
      result.current.updateReaderSettings({ fontScale: 1.2 })
    })

    expect(result.current.readerSettings.fontScale).toBe(1.2)
    expect(localSettingsSignal.getValue().readerFontScale).toBe(1.2)
  })

  it("leaves the font scale to the reader when neither the device nor the account has one", () => {
    const { result } = renderHook(useReaderSettings)

    expect(result.current.readerSettings.fontScale).toBeUndefined()
  })

  it("saves the spread mode on the device, keeping its font scale and other settings", () => {
    localSettingsSignal.update(
      function withDarkThemeAndFontScale(settings): LocalSettings {
        return { ...settings, themeMode: "dark", readerFontScale: 1.3 }
      },
    )
    const { result } = renderHook(useReaderSettings)

    expect(result.current.readerSettings.spreadMode).toBe("auto")

    act(function changeSpreadModeOnDevice() {
      result.current.updateReaderSettings({ spreadMode: "always" })
    })

    expect(result.current.readerSettings).toEqual({
      fontScale: 1.3,
      spreadMode: "always",
    })
    expect(localSettingsSignal.getValue()).toMatchObject({
      readerSpreadMode: "always",
      readerFontScale: 1.3,
      themeMode: "dark",
    })
  })
})
