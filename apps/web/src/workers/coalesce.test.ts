import { describe, expect, it, vi } from "vitest"
import { coalesce } from "./coalesce"

const createDeferred = <Result>() => {
  let resolve!: (value: Result) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<Result>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const createSequencedFn = () => {
  const deferreds = [createDeferred<string>(), createDeferred<string>()]
  let callIndex = 0
  const fn = vi.fn((_value: string) => {
    const deferred = deferreds[callIndex]
    callIndex += 1

    if (!deferred) throw new Error("unexpected extra call")

    return deferred.promise
  })

  return { fn, deferreds }
}

describe("coalesce", () => {
  it("runs the function once for a single call and returns its result", async () => {
    const fn = vi.fn((value: string) => Promise.resolve(value))
    const coalesced = coalesce(fn)

    await expect(coalesced("a")).resolves.toBe("a")
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("collapses concurrent calls into the running run plus one trailing run with the latest args", async () => {
    const { fn, deferreds } = createSequencedFn()
    const coalesced = coalesce(fn)

    const first = coalesced("a")
    const second = coalesced("b")
    const third = coalesced("c")

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenNthCalledWith(1, "a")

    deferreds[0]?.resolve("ra")
    await expect(first).resolves.toBe("ra")

    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenNthCalledWith(2, "c")

    deferreds[1]?.resolve("rc")
    await expect(second).resolves.toBe("rc")
    await expect(third).resolves.toBe("rc")
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it("starts a fresh run once the queue has drained", async () => {
    const fn = vi.fn((value: string) => Promise.resolve(value))
    const coalesced = coalesce(fn)

    await expect(coalesced("a")).resolves.toBe("a")
    await expect(coalesced("b")).resolves.toBe("b")

    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenNthCalledWith(1, "a")
    expect(fn).toHaveBeenNthCalledWith(2, "b")
  })

  it("still runs the trailing run after the in-flight run rejects", async () => {
    const { fn, deferreds } = createSequencedFn()
    const coalesced = coalesce(fn)

    const first = coalesced("a")
    const second = coalesced("b")

    deferreds[0]?.reject(new Error("boom"))
    await expect(first).rejects.toThrow("boom")

    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenNthCalledWith(2, "b")

    deferreds[1]?.resolve("rb")
    await expect(second).resolves.toBe("rb")
  })
})
