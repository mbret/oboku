import { firstValueFrom, Subject } from "rxjs"
import { describe, expect, it, vi } from "vitest"
import { waitForAll } from "./waitForAll.js"

describe("waitForAll", () => {
  it("resolves with the values of the steps, in their order", async () => {
    await expect(
      waitForAll([Promise.resolve("first"), Promise.resolve(2)]),
    ).resolves.toEqual(["first", 2])
  })

  it("rejects only when every step is settled", async () => {
    const failure = new Error("The first step failed")
    const slowStep = new Subject<string>()
    const recordFailure = vi.fn<(error: unknown) => void>()

    const waiting = waitForAll([
      Promise.reject(failure),
      firstValueFrom(slowStep),
    ]).catch(recordFailure)
    await new Promise(setImmediate)

    expect(recordFailure).not.toHaveBeenCalled()

    slowStep.next("done")
    await waiting

    expect(recordFailure).toHaveBeenCalledExactlyOnceWith(failure)
  })

  it("rejects with the failure of the first failed step, in the order of the steps", async () => {
    const firstFailure = new Error("The first step failed")
    const slowFirstStep = new Subject<never>()

    const waiting = waitForAll([
      firstValueFrom(slowFirstStep),
      Promise.reject(new Error("The second step failed")),
    ])
    slowFirstStep.error(firstFailure)

    await expect(waiting).rejects.toBe(firstFailure)
  })
})
