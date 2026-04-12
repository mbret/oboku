import { afterEach, describe, expect, it } from "vitest"
import { firstValueFrom, Observable, of, throwError } from "rxjs"
import {
  addLockKey,
  lock,
  lockState,
  removeLockKey,
  unlock,
  withLock,
} from "./utils"

describe("BlockingBackdrop lock state", () => {
  afterEach(() => {
    lockState.setValue([])
  })

  it("does not duplicate an existing lock key", () => {
    expect(addLockKey(["one-drive"], "one-drive")).toEqual(["one-drive"])
  })

  it("adds a new lock key once", () => {
    expect(addLockKey(["signup"], "one-drive")).toEqual(["signup", "one-drive"])
  })

  it("does nothing when removing a missing lock key", () => {
    expect(removeLockKey(["signup"], "one-drive")).toEqual(["signup"])
  })

  it("removes only the requested lock key", () => {
    expect(removeLockKey(["signup", "one-drive"], "one-drive")).toEqual([
      "signup",
    ])
  })

  it("returns a release function when locking without a key", () => {
    const releaseLock = lock()

    expect(releaseLock).toBeTypeOf("function")
    expect(() => releaseLock()).not.toThrow()
  })

  it("supports keyed lock and unlock calls", () => {
    const releaseLock = lock("one-drive")

    expect(releaseLock).toBeTypeOf("function")
    expect(() => unlock("one-drive")).not.toThrow()
    expect(() => releaseLock()).not.toThrow()
  })

  it("locks on subscribe and releases on completion", async () => {
    await expect(
      firstValueFrom(of(1).pipe(withLock("magic-link-complete"))),
    ).resolves.toBe(1)

    expect(lockState.getValue()).toEqual([])
  })

  it("releases the lock when the stream errors", async () => {
    await expect(
      firstValueFrom(
        throwError(() => new Error("boom")).pipe(withLock("signup")),
      ),
    ).rejects.toThrow("boom")

    expect(lockState.getValue()).toEqual([])
  })

  it("releases the lock when the subscription is disposed", () => {
    const subscription = new Observable<number>(() => {
      expect(lockState.getValue()).toEqual(["authentication"])

      return () => undefined
    })
      .pipe(withLock("authentication"))
      .subscribe()

    expect(lockState.getValue()).toEqual(["authentication"])

    subscription.unsubscribe()

    expect(lockState.getValue()).toEqual([])
  })
})
