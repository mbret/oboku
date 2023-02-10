export const createDeferrablePromise = <T>() => {
  let lazyResolve = (_: T) => {}
  let lazyReject = (_: unknown) => {}

  const promise = new Promise<T>((resolve, reject) => {
    lazyResolve = resolve
    lazyReject = reject
  })

  return { resolve: lazyResolve, reject: lazyReject, promise }
}
