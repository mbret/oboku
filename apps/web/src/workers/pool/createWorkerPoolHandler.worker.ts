import type {
  WorkerPoolEnvelope,
  WorkerPoolErrorPayload,
  WorkerPoolResult,
} from "./types.shared"

export type WorkerPoolHandlerResult<Response> = {
  response: Response
  transfer?: Transferable[]
}

type WorkerScope<Request, Response> = {
  onmessage: ((event: MessageEvent<WorkerPoolEnvelope<Request>>) => void) | null
  postMessage: (
    message: WorkerPoolResult<Response>,
    transfer: Transferable[],
  ) => void
}

const toErrorPayload = (error: unknown): WorkerPoolErrorPayload =>
  error instanceof Error
    ? { name: error.name, message: error.message, stack: error.stack }
    : { name: "Error", message: String(error) }

/**
 * Worker-side counterpart of {@link createWorkerPool}. Unwraps the pool
 * envelope, runs `handler`, and replies with the same id so the pool can match
 * the response. The handler may return transferables to hand back ownership of
 * large buffers.
 */
export const createWorkerPoolHandler = <Request, Response>(
  handler: (
    request: Request,
  ) =>
    | WorkerPoolHandlerResult<Response>
    | Promise<WorkerPoolHandlerResult<Response>>,
) => {
  // In a worker module `self` is typed by the DOM lib as a Window; cast it to
  // the dedicated-worker messaging surface we actually use.
  const ctx = self as unknown as WorkerScope<Request, Response>

  ctx.onmessage = (event) => {
    const { id, payload } = event.data

    void Promise.resolve()
      .then(() => handler(payload))
      .then(
        ({ response, transfer = [] }) => {
          ctx.postMessage({ id, payload: response }, transfer)
        },
        (error: unknown) => {
          ctx.postMessage({ id, error: toErrorPayload(error) }, [])
        },
      )
  }
}
