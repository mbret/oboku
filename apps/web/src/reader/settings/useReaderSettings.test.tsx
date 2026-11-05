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

  it("defaults the font scale to the account's on a device that has not changed it", () => {
    mocks.accountSettings = { readerGlobalFontScale: 1.4 }

    const { result } = renderHook(useReaderSettings)

    expect(result.current.readerSettings.fontScale).toBeUndefined()
    expect(result.current.defaultReaderSettings.fontScale).toBe(1.4)
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
    expect(result.current.defaultReaderSettings.fontScale).toBeUndefined()
  })

  it("saves the spread mode on the device, keeping its font scale and other settings", () => {
    localSettingsSignal.update(
      function withDarkThemeAndFontScale(settings): LocalSettings {
        return { ...settings, themeMode: "dark", readerFontScale: 1.3 }
      },
    )
    const { result } = renderHook(useReaderSettings)

    expect(result.current.readerSettings.spreadMode).toBeUndefined()

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

  it("leaves the theme to the reader until the device picks one", () => {
    const { result } = renderHook(useReaderSettings)

    expect(result.current.readerSettings.theme).toBeUndefined()
  })

  it("saves the theme on the device, keeping its other reader settings", () => {
    localSettingsSignal.update(
      function withSpreadModeAndFontScale(settings): LocalSettings {
        return { ...settings, readerSpreadMode: "always", readerFontScale: 1.3 }
      },
    )
    const { result } = renderHook(useReaderSettings)

    act(function changeThemeOnDevice() {
      result.current.updateReaderSettings({ theme: "night" })
    })

    expect(result.current.readerSettings).toEqual({
      fontScale: 1.3,
      spreadMode: "always",
      theme: "night",
    })
    expect(localSettingsSignal.getValue()).toMatchObject({
      readerTheme: "night",
      readerSpreadMode: "always",
      readerFontScale: 1.3,
    })
  })

  it("sets a setting back to its default on the device when react-reader reports it as undefined", () => {
    localSettingsSignal.update(
      function withThemeAndFontScale(settings): LocalSettings {
        return { ...settings, readerTheme: "night", readerFontScale: 1.3 }
      },
    )
    const { result } = renderHook(useReaderSettings)

    act(function setThemeBackToDefault() {
      result.current.updateReaderSettings({ theme: undefined })
    })

    expect(result.current.readerSettings).toEqual({ fontScale: 1.3 })
    expect(localSettingsSignal.getValue()).toMatchObject({
      readerTheme: null,
      readerFontScale: 1.3,
    })
  })

  it("sends the font scale back to the account's when the device sets it back to default", () => {
    mocks.accountSettings = { readerGlobalFontScale: 1.4 }
    localSettingsSignal.update(function withFontScale(settings): LocalSettings {
      return { ...settings, readerFontScale: 1.3 }
    })
    const { result } = renderHook(useReaderSettings)

    act(function setFontScaleBackToDefault() {
      result.current.updateReaderSettings({ fontScale: undefined })
    })

    expect(result.current.readerSettings.fontScale).toBeUndefined()
    expect(result.current.defaultReaderSettings.fontScale).toBe(1.4)
    expect(localSettingsSignal.getValue().readerFontScale).toBeNull()
  })
})
