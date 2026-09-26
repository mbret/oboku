// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react"
import { SIGNAL_RESET } from "reactjrx"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { localSettingsSignal } from "../../settings/useLocalSettings"

const mocks = vi.hoisted(function createFontScaleMocks() {
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

import { useReaderFontScale } from "./fontScale"

describe("useReaderFontScale", () => {
  beforeEach(function resetDeviceAndAccountSettings() {
    localSettingsSignal.update(SIGNAL_RESET)
    mocks.accountSettings = {}
  })

  it("uses the account's font scale on a device that has not changed it", () => {
    mocks.accountSettings = { readerGlobalFontScale: 1.4 }

    const { result } = renderHook(useReaderFontScale)

    expect(result.current.fontScale).toBe(1.4)
  })

  it("saves a change on the device, which then wins over the account's", () => {
    mocks.accountSettings = { readerGlobalFontScale: 1.4 }
    const { result } = renderHook(useReaderFontScale)

    act(function changeFontScaleOnDevice() {
      result.current.updateFontScale(1.2)
    })

    expect(result.current.fontScale).toBe(1.2)
    expect(localSettingsSignal.getValue().readerFontScale).toBe(1.2)
  })

  it("leaves the font scale to the reader when neither the device nor the account has one", () => {
    const { result } = renderHook(useReaderFontScale)

    expect(result.current.fontScale).toBeUndefined()
  })
})
