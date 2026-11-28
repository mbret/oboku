export class SourceStalledError extends Error {
  constructor(maxIdleMs: number) {
    super(`The source sent nothing for ${maxIdleMs} ms`)
  }
}

const nextPartOrStall = <TPart>(
  parts: AsyncIterator<TPart>,
  maxIdleMs: number,
) =>
  new Promise<IteratorResult<TPart>>(
    function raceNextPartWithIdleTimer(resolve, reject) {
      const idleTimer = setTimeout(function failAsStalled() {
        reject(new SourceStalledError(maxIdleMs))
      }, maxIdleMs)

      parts
        .next()
        .then(resolve, reject)
        .finally(function stopIdleTimer() {
          clearTimeout(idleTimer)
        })
    },
  )

/**
 * Passes a file on, and fails with `SourceStalledError` once its source
 * takes more than `maxIdleMs` to give the next part it is asked for. The
 * time a slow reader takes to ask for a part does not count.
 */
export async function* failOnceSourceStalls<TPart>(
  file: AsyncIterable<TPart>,
  maxIdleMs: number,
) {
  const parts = file[Symbol.asyncIterator]()

  while (true) {
    const part = await nextPartOrStall(parts, maxIdleMs)

    if (part.done) return

    yield part.value
  }
}
