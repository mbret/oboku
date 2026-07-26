import { QueryClient, skipToken } from "@tanstack/react-query"
import { of, Subject } from "rxjs"
import { describe, expect, it, vi } from "vitest"
import { ensureQueryData$ } from "./ensureQueryData$"

describe("ensureQueryData$", () => {
  it("returns cached data without subscribing the source", async () => {
    const client = new QueryClient()
    client.setQueryData(["cached"], "cached-value")
    const queryFn = vi.fn(() => of("fresh"))

    await expect(
      ensureQueryData$(client, { queryKey: ["cached"], queryFn }),
    ).resolves.toBe("cached-value")
    expect(queryFn).not.toHaveBeenCalled()
  })

  it("resolves the first emission and seeds the empty cache", async () => {
    const client = new QueryClient()

    await expect(
      ensureQueryData$(client, {
        queryKey: ["cold"],
        queryFn: () => of("first"),
      }),
    ).resolves.toBe("first")
    expect(client.getQueryData(["cold"])).toBe("first")
  })

  it("does not clobber a value cached while resolving", async () => {
    const client = new QueryClient()
    const source$ = new Subject<string>()

    const pendingFirstValue = ensureQueryData$(client, {
      queryKey: ["race"],
      queryFn: () => source$,
    })

    client.setQueryData(["race"], "live-value")
    source$.next("late-value")

    await expect(pendingFirstValue).resolves.toBe("late-value")
    expect(client.getQueryData(["race"])).toBe("live-value")
  })

  it("rejects on a skipToken queryFn", async () => {
    const client = new QueryClient()

    await expect(
      ensureQueryData$(client, { queryKey: ["skipped"], queryFn: skipToken }),
    ).rejects.toThrow("skipToken")
  })
})
