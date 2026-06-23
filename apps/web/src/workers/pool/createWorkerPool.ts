import type { WorkerPoolEnvelope, WorkerPoolResult } from "./types.shared"

export type WorkerPool<Request, Response> = {
  run: (request: Request, transfer?: Transferable[]) => Promise<Response>
  terminate: () => void
}

type PendingTask<Request, Response> = {
  id: number
  request: Request
  transfer: Transferable[]
  resolve: (response: Response) => void
  reject: (error: Error) => void
}

/**
 * Generic pool that dispatches request messages across a fixed set of workers
 * and resolves with each worker's reply. Requests and responses are wrapped in
 * a {@link WorkerPoolEnvelope} so the pool can correlate them regardless of the
 * payload shape; workers are expected to consume the envelope via
 * `createWorkerPoolHandler`.
 */
export const createWorkerPool = <Request, Response>({
  createWorker,
  size = navigator.hardwareConcurrency || 4,
}: {
  createWorker: () => Worker
  size?: number
}): WorkerPool<Request, Response> => {
  const queue: PendingTask<Request, Response>[] = []
  const pending = new Map<number, PendingTask<Request, Response>>()
  const runningByWorker = new Map<Worker, PendingTask<Request, Response>>()
  const liveWorkers = new Set<Worker>()
  const idle: Worker[] = []
  let nextId = 0

  const pump = () => {
    while (idle.length > 0 && queue.length > 0) {
      const worker = idle.pop()
      const task = queue.shift()

      if (!worker || !task) break

      pending.set(task.id, task)
      runningByWorker.set(worker, task)
      const envelope: WorkerPoolEnvelope<Request> = {
        id: task.id,
        payload: task.request,
      }
      worker.postMessage(envelope, task.transfer)
    }
  }

  const handle = (worker: Worker, result: WorkerPoolResult<Response>) => {
    const task = pending.get(result.id)
    pending.delete(result.id)
    runningByWorker.delete(worker)
    idle.push(worker)

    if (task) {
      if (result.error) {
        const error = new Error(result.error.message)
        error.name = result.error.name
        error.stack = result.error.stack
        task.reject(error)
      } else {
        task.resolve(result.payload)
      }
    }

    pump()
  }

  const failAll = (error: Error) => {
    for (const task of queue) task.reject(error)
    queue.length = 0

    for (const task of pending.values()) task.reject(error)
    pending.clear()
    runningByWorker.clear()
  }

  const handleError = (worker: Worker, message: string) => {
    liveWorkers.delete(worker)

    const idleIndex = idle.indexOf(worker)
    if (idleIndex !== -1) idle.splice(idleIndex, 1)

    const task = runningByWorker.get(worker)
    if (task) {
      runningByWorker.delete(worker)
      pending.delete(task.id)
      task.reject(new Error(message))
    }

    worker.terminate()

    if (liveWorkers.size === 0) {
      failAll(new Error(message))

      return
    }

    pump()
  }

  const workers = Array.from({ length: Math.max(1, size) }, () => {
    const worker = createWorker()

    worker.onmessage = (event: MessageEvent<WorkerPoolResult<Response>>) => {
      handle(worker, event.data)
    }

    worker.onerror = (event: ErrorEvent) => {
      handleError(worker, event.message || "Worker pool worker errored")
    }

    liveWorkers.add(worker)
    idle.push(worker)

    return worker
  })

  const run = (
    request: Request,
    transfer: Transferable[] = [],
  ): Promise<Response> =>
    new Promise((resolve, reject) => {
      const id = nextId
      nextId += 1

      queue.push({ id, request, transfer, resolve, reject })
      pump()
    })

  const terminate = () => {
    for (const worker of workers) {
      worker.terminate()
    }
    queue.length = 0
    pending.clear()
    runningByWorker.clear()
    liveWorkers.clear()
  }

  return { run, terminate }
}
