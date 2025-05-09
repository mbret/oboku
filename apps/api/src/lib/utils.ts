import * as fs from "node:fs"
import * as unzipper from "unzipper"
import type { READER_ACCEPTED_MIME_TYPES } from "@oboku/shared"
import {
  catchError,
  ignoreElements,
  map,
  type Observable,
  switchMap,
  tap,
} from "rxjs"

export const waitForRandomTime = (min: number, max: number) =>
  new Promise((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)),
  )

export const detectMimeTypeFromContent = async (
  filepath: string,
): Promise<(typeof READER_ACCEPTED_MIME_TYPES)[number] | undefined> => {
  let mimeType: (typeof READER_ACCEPTED_MIME_TYPES)[number] | undefined =
    undefined
  try {
    await fs
      .createReadStream(filepath)
      .pipe(unzipper.Parse())
      .on("entry", (entry) => {
        if (!mimeType && entry.path.endsWith(".opf")) {
          mimeType = "application/epub+zip"
        }

        entry.autodrain()
      })
      .promise()
  } catch (e) {
    console.log(
      `Error when trying to detectMimeTypeFromContent with ${filepath}`,
    )
  }

  return mimeType
}

export const asError = (e: unknown) => {
  return {
    message: hasMessage(e) ? e.message : ``,
  }
}

const hasMessage = <MessageError extends { message: string }>(
  e: MessageError | unknown,
): e is MessageError => {
  return `message` in (e as any) && typeof (e as any).message === "string"
}

export async function performWithBackoff<T>({
  asyncFunction,
  retry,
  attempt = 1,
  maxAttempts = 5,
  minDelay = 1000,
  maxDelay = 10000,
}: {
  asyncFunction: () => Promise<T>
  retry: (error: unknown) => boolean
  attempt?: number
  maxAttempts?: number
  minDelay?: number
  maxDelay?: number
}): Promise<T> {
  try {
    const result = await asyncFunction()

    return result
  } catch (error) {
    if (attempt < maxAttempts && retry(error)) {
      const delay = Math.random() * (maxDelay - minDelay) + minDelay

      await new Promise((resolve) => setTimeout(resolve, delay))

      return performWithBackoff({
        asyncFunction,
        attempt: attempt + 1,
        retry,
        maxAttempts,
        minDelay,
        maxDelay,
      })
    }
    throw error
  }
}

export const createThrottler = (ms: number) => {
  const list: (() => any)[] = []

  setInterval(() => {
    const toProcess = list.shift()
    if (toProcess) {
      toProcess()
    }
  }, ms)

  return <F extends (...args: any) => any>(fn: F) =>
    (...args: Parameters<F>) =>
      new Promise<ReturnType<F>>((resolve, reject) => {
        list.push(() =>
          fn(...(args as any))
            .then(resolve)
            .catch(reject),
        )
      })
}

export const onBeforeError =
  <T>(callback: (error: unknown) => Observable<any>) =>
  (stream: Observable<T>) =>
    stream.pipe(
      catchError((error) =>
        callback(error).pipe(
          tap(() => {
            throw error
          }),
          ignoreElements(),
        ),
      ),
    )

export const switchMapMergeOuter = <T, R>(
  project: (value: T) => Observable<R>,
) =>
  switchMap((outer: T) =>
    project(outer).pipe(map((inner) => ({ ...outer, ...inner }))),
  )

export const switchMapCombineOuter = <T, R>(
  project: (value: T) => Observable<R>,
) =>
  switchMap((outer: T) =>
    project(outer).pipe(map<R, [T, R]>((inner) => [outer, inner])),
  )
