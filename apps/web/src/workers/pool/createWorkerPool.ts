import type { WorkerPoolEnvelope } from "./types.shared"

export type WorkerPool<Request, Response> = {
  run: (request: Request, transfer?: Transferable[]) => Promise<Response>
  terminate: () => void
}

type PendingTask<Request, Response> = {
  id: number
  request: Request
  transfer: Transferable[]
  resolve: (response: Response) => void
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
  const idle: Worker[] = []
  let nextId = 0

  const pump = () => {
    while (idle.length > 0 && queue.length > 0) {
      const worker = idle.pop()
      const task = queue.shift()

      if (!worker || !task) break

      pending.set(task.id, task)
      const envelope: WorkerPoolEnvelope<Request> = {
        id: task.id,
        payload: task.request,
      }
      worker.postMessage(envelope, task.transfer)
    }
  }

  const handle = (worker: Worker, envelope: WorkerPoolEnvelope<Response>) => {
    const task = pending.get(envelope.id)
    pending.delete(envelope.id)
    idle.push(worker)

    task?.resolve(envelope.payload)

    pump()
  }

  const workers = Array.from({ length: Math.max(1, size) }, () => {
    const worker = createWorker()

    worker.onmessage = (event: MessageEvent<WorkerPoolEnvelope<Response>>) => {
      handle(worker, event.data)
    }

    idle.push(worker)

    return worker
  })

  const run = (
    request: Request,
    transfer: Transferable[] = [],
  ): Promise<Response> =>
    new Promise((resolve) => {
      const id = nextId
      nextId += 1

      queue.push({ id, request, transfer, resolve })
      pump()
    })

  const terminate = () => {
    for (const worker of workers) {
      worker.terminate()
    }
    queue.length = 0
    pending.clear()
  }

  return { run, terminate }
}
