import { COLLECTION_METADATA_LOCK_MN } from "@oboku/shared"
import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useIsCollectionMetadataRefreshing } from "./useIsCollectionMetadataRefreshing"

const MINUTE_IN_MILLISECONDS = 60_000
const LOCK_IN_MILLISECONDS =
  COLLECTION_METADATA_LOCK_MN * MINUTE_IN_MILLISECONDS

describe("useIsCollectionMetadataRefreshing", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("is refreshing while the lock is active, then unlocks when it expires", () => {
    const startedAt = new Date()
    const { result } = renderHook(() =>
      useIsCollectionMetadataRefreshing({
        metadataUpdateStatus: "fetching",
        lastMetadataStartedAt: startedAt.toISOString(),
      }),
    )

    expect(result.current).toBe(true)

    act(() => {
      vi.advanceTimersByTime(LOCK_IN_MILLISECONDS - 1)
    })

    expect(result.current).toBe(true)

    act(() => {
      vi.advanceTimersByTime(1)
    })

    expect(result.current).toBe(false)
  })

  it("is refreshing from the first render while the lock is active", () => {
    const onRender = vi.fn()

    renderHook(() => {
      const isRefreshing = useIsCollectionMetadataRefreshing({
        metadataUpdateStatus: "fetching",
        lastMetadataStartedAt: new Date().toISOString(),
      })

      onRender(isRefreshing)

      return isRefreshing
    })

    expect(onRender).toHaveBeenNthCalledWith(1, true)
  })

  it("is not refreshing when the lock has already expired", () => {
    const startedAt = new Date(Date.now() - LOCK_IN_MILLISECONDS)
    const { result } = renderHook(() =>
      useIsCollectionMetadataRefreshing({
        metadataUpdateStatus: "fetching",
        lastMetadataStartedAt: startedAt.toISOString(),
      }),
    )

    expect(result.current).toBe(false)
  })

  it("is not refreshing when the collection is idle", () => {
    const { result } = renderHook(() =>
      useIsCollectionMetadataRefreshing({
        metadataUpdateStatus: "idle",
        lastMetadataStartedAt: new Date().toISOString(),
      }),
    )

    expect(result.current).toBe(false)
  })

  it("is refreshing again when a new refresh starts", () => {
    const idleCollection: Parameters<
      typeof useIsCollectionMetadataRefreshing
    >[0] = { metadataUpdateStatus: "idle" }
    const { result, rerender } = renderHook(useIsCollectionMetadataRefreshing, {
      initialProps: idleCollection,
    })

    expect(result.current).toBe(false)

    rerender({
      metadataUpdateStatus: "fetching",
      lastMetadataStartedAt: new Date().toISOString(),
    })

    expect(result.current).toBe(true)
  })
})
