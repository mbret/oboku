import { describe, expect, it, vi } from "vitest"
import { waitForAll } from "./waitForAll"

describe("waitForAll", () => {
  it("resolves with the values of the steps, in their order", async () => {
    await expect(
      waitForAll([Promise.resolve("first"), Promise.resolve(2)]),
    ).resolves.toEqual(["first", 2])
  })

  it("rejects only when every step is settled", async () => {
    const failure = new Error("The first step failed")
    const slowStep = Promise.withResolvers<string>()
    const recordFailure = vi.fn<(error: unknown) => void>()

    const waiting = waitForAll([
      Promise.reject(failure),
      slowStep.promise,
    ]).catch(recordFailure)
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(recordFailure).not.toHaveBeenCalled()

    slowStep.resolve("done")
    await waiting

    expect(recordFailure).toHaveBeenCalledExactlyOnceWith(failure)
  })

  it("rejects with the failure of the first failed step, in the order of the steps", async () => {
    const firstFailure = new Error("The first step failed")
    const slowFirstStep = Promise.withResolvers<never>()

    const waiting = waitForAll([
      slowFirstStep.promise,
      Promise.reject(new Error("The second step failed")),
    ])
    slowFirstStep.reject(firstFailure)

    await expect(waiting).rejects.toBe(firstFailure)
  })
})
