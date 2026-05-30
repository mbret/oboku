export type WorkerPoolEnvelope<T> = {
  id: number
  payload: T
}

export type WorkerPoolErrorPayload = {
  name: string
  message: string
  stack?: string
}

export type WorkerPoolResult<T> =
  | { id: number; payload: T; error?: undefined }
  | { id: number; payload?: undefined; error: WorkerPoolErrorPayload }
