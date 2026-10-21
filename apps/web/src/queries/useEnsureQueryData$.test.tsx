import {
  onlineManager,
  QueryClient,
  QueryClientProvider,
  type QueryKey,
  skipToken,
} from "@tanstack/react-query"
import { act, cleanup, render, waitFor } from "@testing-library/react"
import { useLiveQuery$ } from "reactjrx"
import { BehaviorSubject, of } from "rxjs"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useEnsureQueryData$ } from "./useEnsureQueryData$"

afterEach(cleanup)

type ProbeOptions = Parameters<typeof useEnsureQueryData$>[0]

let latestResult: ReturnType<typeof useEnsureQueryData$>

const Probe = (options: ProbeOptions) => {
  latestResult = useEnsureQueryData$(options)

  return null
}

const renderProbe = (options: ProbeOptions) => {
  const client = new QueryClient()
  const view = render(
    <QueryClientProvider client={client}>
      <Probe {...options} />
    </QueryClientProvider>,
  )

  return {
    rerenderProbe: (nextOptions: ProbeOptions) =>
      view.rerender(
        <QueryClientProvider client={client}>
          <Probe {...nextOptions} />
        </QueryClientProvider>,
      ),
  }
}

describe("useEnsureQueryData$", () => {
  it("resolves the first emitted value", async () => {
    renderProbe({ queryKey: ["first-value"], queryFn: () => of("initial") })

    await waitFor(() => expect(latestResult.data).toBe("initial"))
    expect(latestResult.error).toBeNull()
  })

  it("ignores later values a live query writes to the same cache entry", async () => {
    const queryKey: QueryKey = ["frozen"]
    const source$ = new BehaviorSubject("initial")
    const onLiveQueryRender = vi.fn()

    function LiveQuery() {
      onLiveQueryRender(
        useLiveQuery$({ queryKey, queryFn: () => source$ }).data,
      )

      return null
    }

    render(
      <QueryClientProvider client={new QueryClient()}>
        <LiveQuery />
        <Probe queryKey={queryKey} queryFn={() => source$} />
      </QueryClientProvider>,
    )

    await waitFor(() => expect(latestResult.data).toBe("initial"))

    act(function emitUpdatedValue() {
      source$.next("updated")
    })

    await waitFor(() =>
      expect(onLiveQueryRender).toHaveBeenLastCalledWith("updated"),
    )
    expect(latestResult.data).toBe("initial")
  })

  it("captures null as a resolved result", async () => {
    renderProbe({ queryKey: ["null-result"], queryFn: () => of(null) })

    await waitFor(() => expect(latestResult.data).toBeNull())
  })

  it("stays unresolved with a skipToken queryFn", async () => {
    renderProbe({ queryKey: ["skipped"], queryFn: skipToken })

    await act(async () => {})

    expect(latestResult.data).toBeUndefined()
    expect(latestResult.error).toBeNull()
  })

  it("resolves from a local source while offline", async () => {
    onlineManager.setOnline(false)

    try {
      renderProbe({
        queryKey: ["offline"],
        queryFn: () => of("local-value"),
      })

      await waitFor(() => expect(latestResult.data).toBe("local-value"))
    } finally {
      onlineManager.setOnline(true)
    }
  })

  it("shares a single resolution between concurrent consumers of a key", async () => {
    const queryFn = vi.fn(() => of("shared"))

    render(
      <QueryClientProvider client={new QueryClient()}>
        <Probe queryKey={["shared-key"]} queryFn={queryFn} />
        <Probe queryKey={["shared-key"]} queryFn={queryFn} />
      </QueryClientProvider>,
    )

    await waitFor(() => expect(latestResult.data).toBe("shared"))
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it("resolves a fresh snapshot when the query key changes", async () => {
    const { rerenderProbe } = renderProbe({
      queryKey: ["key-change", "a"],
      queryFn: () => of("value-a"),
    })

    await waitFor(() => expect(latestResult.data).toBe("value-a"))

    rerenderProbe({
      queryKey: ["key-change", "b"],
      queryFn: () => of("value-b"),
    })

    await waitFor(() => expect(latestResult.data).toBe("value-b"))
  })
})
