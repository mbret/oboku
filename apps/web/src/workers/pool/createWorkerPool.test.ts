// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { createWorkerPool } from "./createWorkerPool"
import type { WorkerPoolEnvelope, WorkerPoolResult } from "./types.shared"

class FakeWorker {
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: ErrorEvent) => void) | null = null
  readonly posted: WorkerPoolEnvelope<unknown>[] = []
  terminated = false

  postMessage(envelope: WorkerPoolEnvelope<unknown>) {
    this.posted.push(envelope)
  }

  terminate() {
    this.terminated = true
  }

  respond(result: WorkerPoolResult<unknown>) {
    this.onmessage?.(new MessageEvent("message", { data: result }))
  }

  crash(message = "boom") {
    this.onerror?.(new ErrorEvent("error", { message }))
  }
}

const createPool = (size: number) => {
  const workers: FakeWorker[] = []

  const pool = createWorkerPool<string, string>({
    size,
    createWorker: () => {
      const worker = new FakeWorker()
      workers.push(worker)

      // FakeWorker only implements the slice of the Worker contract the pool
      // touches; the real DOM Worker is unavailable under jsdom.
      return worker as unknown as Worker
    },
  })

  return { pool, workers }
}

const workerForId = (workers: FakeWorker[], id: number) =>
  workers.find((worker) => worker.posted.some((envelope) => envelope.id === id))

describe("createWorkerPool", () => {
  it("rejects the in-flight task when its worker errors", async () => {
    const { pool, workers } = createPool(1)

    const result = pool.run("a")

    expect(workers[0]?.posted).toHaveLength(1)

    workers[0]?.crash("worker exploded")

    await expect(result).rejects.toThrow("worker exploded")
    expect(workers[0]?.terminated).toBe(true)
  })

  it("rejects queued tasks when the last worker errors", async () => {
    const { pool, workers } = createPool(1)

    const inFlight = pool.run("a")
    const queued = pool.run("b")

    workers[0]?.crash("dead pool")

    await expect(inFlight).rejects.toThrow("dead pool")
    await expect(queued).rejects.toThrow("dead pool")
  })

  it("keeps serving on the surviving workers when one errors", async () => {
    const { pool, workers } = createPool(2)

    const first = pool.run("a")
    const second = pool.run("b")

    const firstWorker = workerForId(workers, 0)
    const secondWorker = workerForId(workers, 1)

    firstWorker?.crash("only this one dies")
    secondWorker?.respond({ id: 1, payload: "b-done" })

    await expect(first).rejects.toThrow("only this one dies")
    await expect(second).resolves.toBe("b-done")

    const third = pool.run("c")
    const thirdWorker = workerForId(workers, 2)

    expect(thirdWorker).toBe(secondWorker)

    thirdWorker?.respond({ id: 2, payload: "c-done" })

    await expect(third).resolves.toBe("c-done")
    expect(firstWorker?.terminated).toBe(true)
  })
})
