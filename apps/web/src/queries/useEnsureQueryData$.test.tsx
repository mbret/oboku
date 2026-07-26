// @vitest-environment jsdom

import {
  QueryClient,
  QueryClientProvider,
  type QueryKey,
  skipToken,
} from "@tanstack/react-query"
import { act, cleanup, render, waitFor } from "@testing-library/react"
import { QueryClientProvider$ } from "reactjrx"
import { BehaviorSubject, of } from "rxjs"
import { afterEach, describe, expect, it } from "vitest"
import { useEnsureQueryData$ } from "./useEnsureQueryData$"

afterEach(cleanup)

type ProbeOptions = Parameters<typeof useEnsureQueryData$>[0]

let latestResult: ReturnType<typeof useEnsureQueryData$>

const Probe = (options: ProbeOptions) => {
  latestResult = useEnsureQueryData$(options)

  return null
}

const renderProbe = (options: ProbeOptions, client = new QueryClient()) => {
  const view = render(
    <QueryClientProvider client={client}>
      <QueryClientProvider$>
        <Probe {...options} />
      </QueryClientProvider$>
    </QueryClientProvider>,
  )

  return {
    rerenderProbe: (nextOptions: ProbeOptions) =>
      view.rerender(
        <QueryClientProvider client={client}>
          <QueryClientProvider$>
            <Probe {...nextOptions} />
          </QueryClientProvider$>
        </QueryClientProvider>,
      ),
  }
}

describe("useEnsureQueryData$", () => {
  it("resolves the first emitted value", async () => {
    renderProbe({ queryKey: ["first-value"], queryFn: () => of("initial") })

    await waitFor(() => expect(latestResult.data).toBe("initial"))
    expect(latestResult.error).toBeUndefined()
  })

  it("ignores later updates to the same query cache entry", async () => {
    const queryKey: QueryKey = ["frozen"]
    const source$ = new BehaviorSubject("initial")
    const client = new QueryClient()

    renderProbe({ queryKey, queryFn: () => source$ }, client)

    await waitFor(() => expect(latestResult.data).toBe("initial"))

    await act(async () => {
      source$.next("updated")
      client.setQueryData(queryKey, "updated")
    })

    expect(client.getQueryData(queryKey)).toBe("updated")
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
    expect(latestResult.error).toBeUndefined()
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
