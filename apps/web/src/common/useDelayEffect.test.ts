import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { scheduleDelayedEffect } from "./useDelayEffect"

describe("scheduleDelayedEffect", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("cancels the delayed callback before it runs", () => {
    const callback = vi.fn()
    const dispose = scheduleDelayedEffect(callback, 10)

    dispose()
    vi.advanceTimersByTime(10)

    expect(callback).not.toHaveBeenCalled()
  })

  it("runs the callback cleanup when disposed after the delay", () => {
    const cleanup = vi.fn()
    const callback = vi.fn(() => cleanup)
    const dispose = scheduleDelayedEffect(callback, 10)

    vi.advanceTimersByTime(10)
    dispose()

    expect(callback).toHaveBeenCalledTimes(1)
    expect(cleanup).toHaveBeenCalledTimes(1)
  })
})
