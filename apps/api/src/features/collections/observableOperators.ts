import {
  catchError,
  ignoreElements,
  map,
  type Observable,
  switchMap,
  tap,
} from "rxjs"

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

export const switchMapCombineOuter = <T, R>(
  project: (value: T) => Observable<R>,
) =>
  switchMap((outer: T) =>
    project(outer).pipe(map<R, [T, R]>((inner) => [outer, inner])),
  )
