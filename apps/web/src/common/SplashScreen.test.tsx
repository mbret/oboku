// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { SplashScreen } from "./SplashScreen"

const FADE_TIMEOUT_MS = 500
const SLOW_BOOT_THRESHOLD_MS = 4000

const getLogo = () => screen.queryByText("boku")

const advanceBy = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

describe("SplashScreen", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it("stays visible when the enter transition completes", async () => {
    const { container } = render(<SplashScreen show />)

    const splash = container.firstElementChild

    expect(splash).toBeTruthy()

    if (splash) fireEvent.transitionEnd(splash)

    await advanceBy(FADE_TIMEOUT_MS * 2)

    expect(getLogo()).toBeTruthy()
  })

  it("reveals the loading indicator once the boot exceeds the threshold", async () => {
    render(<SplashScreen show />)

    expect(screen.queryByRole("progressbar")).toBeNull()

    await advanceBy(SLOW_BOOT_THRESHOLD_MS)

    expect(screen.getByRole("progressbar")).toBeTruthy()
    expect(screen.getByText("Still loading…")).toBeTruthy()
  })

  it("unmounts once the exit transition has run", async () => {
    const { rerender } = render(<SplashScreen show />)

    rerender(<SplashScreen show={false} />)

    await advanceBy(FADE_TIMEOUT_MS * 2)

    expect(getLogo()).toBeNull()
  })
})
