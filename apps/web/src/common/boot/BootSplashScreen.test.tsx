// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { BootSplashScreen } from "./BootSplashScreen"
import { isAppReadyStateSignal } from "./states"
import { useConfig } from "../../config/useConfig"

vi.mock("../../config/useConfig", () => ({
  useConfig: vi.fn(),
}))

// test stub: BootSplashScreen only reads `data` off the result
const stubConfigQuery = (data: unknown) =>
  vi
    .mocked(useConfig)
    .mockReturnValue({ data } as unknown as ReturnType<typeof useConfig>)

const FADE_TIMEOUT_MS = 500

const getLogo = () => screen.queryByText("boku")

describe("BootSplashScreen", () => {
  beforeEach(() => {
    isAppReadyStateSignal.setValue(false)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("shows the splash while configuration is still loading", () => {
    stubConfigQuery(undefined)

    render(<BootSplashScreen />)

    expect(getLogo()).toBeTruthy()
  })

  it("keeps the splash once configuration lands but the app is not ready", () => {
    stubConfigQuery({ API_URL: "https://example.test" })

    render(<BootSplashScreen />)

    expect(getLogo()).toBeTruthy()
  })

  it("keeps the same splash element across the configuration handover", () => {
    stubConfigQuery(undefined)

    const { rerender } = render(<BootSplashScreen />)

    const splashWhileLoadingConfig = getLogo()

    stubConfigQuery({ API_URL: "https://example.test" })

    rerender(<BootSplashScreen />)

    expect(getLogo()).toBe(splashWhileLoadingConfig)
  })

  it("hides the splash once configuration is loaded and the app is ready", async () => {
    vi.useFakeTimers()
    stubConfigQuery({ API_URL: "https://example.test" })

    render(<BootSplashScreen />)

    expect(getLogo()).toBeTruthy()

    await act(async () => {
      isAppReadyStateSignal.setValue(true)
      await vi.advanceTimersByTimeAsync(FADE_TIMEOUT_MS * 2)
    })

    expect(getLogo()).toBeNull()

    vi.useRealTimers()
  })
})
