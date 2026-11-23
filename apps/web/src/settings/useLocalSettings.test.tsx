import { act, renderHook } from "@testing-library/react"
import { SIGNAL_RESET } from "reactjrx"
import { beforeEach, describe, expect, it } from "vitest"
import {
  localSettingsDefaultValues,
  localSettingsSignal,
  useLocalSettings,
} from "./useLocalSettings"

describe("useLocalSettings", () => {
  beforeEach(function resetLocalSettings() {
    localSettingsSignal.update(SIGNAL_RESET)
  })

  it("reads a single setting, falling back to its default", () => {
    localSettingsSignal.update((settings) => ({
      ...settings,
      readerFontScale: undefined,
    }))

    const { result } = renderHook(() => useLocalSettings("readerFontScale"))

    expect(result.current).toBe(localSettingsDefaultValues.readerFontScale)
  })

  it("keeps the same selection across renders that pass a new key list with the same keys", () => {
    const { result, rerender } = renderHook(() =>
      useLocalSettings(["readerTheme", "readerFontScale"]),
    )
    const firstSelection = result.current

    rerender()

    expect(result.current).toBe(firstSelection)
    expect(firstSelection).toEqual({ readerTheme: null, readerFontScale: null })
  })

  it("keeps the same selection when a setting outside it changes", () => {
    const { result } = renderHook(() => useLocalSettings(["readerFontScale"]))
    const firstSelection = result.current

    act(function changeUnselectedSetting() {
      localSettingsSignal.update((settings) => ({
        ...settings,
        readerWakeLockEnabled: false,
      }))
    })

    expect(result.current).toBe(firstSelection)
  })

  it("returns a new selection when a selected setting changes", () => {
    const { result } = renderHook(() => useLocalSettings(["readerFontScale"]))

    act(function changeSelectedSetting() {
      localSettingsSignal.update((settings) => ({
        ...settings,
        readerFontScale: 1.2,
      }))
    })

    expect(result.current).toEqual({ readerFontScale: 1.2 })
  })

  it("tells a single key apart from a list holding only that key", () => {
    const { result: single } = renderHook(() =>
      useLocalSettings("readerFontScale"),
    )
    const { result: list } = renderHook(() =>
      useLocalSettings(["readerFontScale"]),
    )

    expect(single.current).toBeNull()
    expect(list.current).toEqual({ readerFontScale: null })
  })
})
