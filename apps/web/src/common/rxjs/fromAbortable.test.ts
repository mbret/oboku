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

  it("leaves the signal of a run that settled unaborted", async () => {
    const resolvingRun = vi.fn(async function resolveWithValue(
      _signal: AbortSignal,
    ) {
      return "uploaded"
    })
    const rejectingRun = vi.fn(async function rejectWithFailure(
      _signal: AbortSignal,
    ) {
      throw new Error("unreachable")
    })

    await lastValueFrom(fromAbortable(resolvingRun))
    await expect(lastValueFrom(fromAbortable(rejectingRun))).rejects.toThrow(
      "unreachable",
    )

    expect(resolvingRun.mock.calls[0]?.[0].aborted).toBe(false)
    expect(rejectingRun.mock.calls[0]?.[0].aborted).toBe(false)
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
