import { firstValueFrom, lastValueFrom, toArray } from "rxjs"
import { describe, expect, it, vi } from "vitest"
import { fromAbortable } from "./fromAbortable"

describe("fromAbortable", () => {
  it("emits what the run resolves with, then completes", async () => {
    const values = await lastValueFrom(
      fromAbortable(async function resolveWithValue() {
        return "uploaded"
      }).pipe(toArray()),
    )

    expect(values).toEqual(["uploaded"])
  })

  it("fails with what the run rejects with", async () => {
    const failure = new Error("unreachable")

    await expect(
      firstValueFrom(
        fromAbortable(async function rejectWithFailure() {
          throw failure
        }),
      ),
    ).rejects.toBe(failure)
  })

  it("starts the run once subscribed, and aborts its signal on unsubscribe", () => {
    const run = vi.fn(function runUntilAborted(_signal: AbortSignal) {
      return Promise.withResolvers<string>().promise
    })
    const abortable$ = fromAbortable(run)

    expect(run).not.toHaveBeenCalled()

    const subscription = abortable$.subscribe()
    const [signal] = run.mock.calls[0] ?? []

    expect(signal?.aborted).toBe(false)

    subscription.unsubscribe()

    expect(signal?.aborted).toBe(true)
  })
})
