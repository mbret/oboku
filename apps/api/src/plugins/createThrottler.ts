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
