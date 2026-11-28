const DATABASE_LIFECYCLE_LOCK = "oboku-rxdb-lifecycle"

/**
 * Creating the RxDB database and removing it both write its internal
 * documents. When two of them run at the same time, in two tabs or in a tab
 * and the service worker, one fails with an RxDB conflict. This per-origin lock
 * runs them one at a time. Hold it only for the operation. It is not
 * reentrant.
 */
export const withDatabaseLifecycleLock = async <T>(
  task: () => Promise<T>,
): Promise<Awaited<T>> =>
  await navigator.locks.request(DATABASE_LIFECYCLE_LOCK, task)
