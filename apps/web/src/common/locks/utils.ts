import { signal } from "reactjrx"
import { defer, finalize, type Observable } from "rxjs"

type Key = string
type ReleaseLock = () => void

export const lockState = signal<Key[]>({
  key: "lock",
  default: [],
})

export const addLockKey = (keys: Key[], key: Key) => {
  if (keys.includes(key)) {
    return keys
  }

  return [...keys, key]
}

export const removeLockKey = (keys: Key[], key: Key) => {
  const index = keys.indexOf(key)

  if (index === -1) {
    return keys
  }

  return [...keys.slice(0, index), ...keys.slice(index + 1)]
}

let defaultLockId = 0

const createDefaultLockKey = () => {
  defaultLockId += 1

  return `lock-${defaultLockId}`
}

export const unlock = (key: Key) => {
  lockState.update((old) => removeLockKey(old, key))
}

export const lock = (key: Key = createDefaultLockKey()): ReleaseLock => {
  lockState.update((old) => addLockKey(old, key))

  return () => unlock(key)
}

export const withLock =
  (key?: string) =>
  <S>(stream: Observable<S>) =>
    defer(() => {
      const releaseLock = lock(key)

      return stream.pipe(finalize(releaseLock))
    })
