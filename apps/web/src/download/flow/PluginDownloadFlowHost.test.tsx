import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  act,
  cleanup,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { DownloadBookVariables } from "../downloadBookMutation"

vi.mock("./DownloadFlowRequestItem", function mockDownloadFlowRequestItem() {
  return {
    DownloadFlowRequestItem: function DownloadFlowRequestItem({
      request,
    }: {
      request: DownloadBookVariables
    }) {
      return <span>{request._id}</span>
    },
  }
})

import { findPendingBookDownload } from "../downloadBookMutation"
import { useDownloadBook } from "../useDownloadBook"
import {
  cancelPluginDownloadFlow,
  PluginDownloadFlowHost,
} from "./PluginDownloadFlowHost"

function renderDownloadFlow(queryClient: QueryClient) {
  return renderHook(
    function useRenderedDownloadBook() {
      return useDownloadBook()
    },
    {
      wrapper: function Wrapper({ children }: { children: ReactNode }) {
        return (
          <QueryClientProvider client={queryClient}>
            <PluginDownloadFlowHost />
            {children}
          </QueryClientProvider>
        )
      },
    },
  )
}

describe("PluginDownloadFlowHost", () => {
  afterEach(function unmountDownloadFlow() {
    cleanup()
  })

  it("renders a download started through useDownloadBook until it settles", async () => {
    const queryClient = new QueryClient()
    const { result } = renderDownloadFlow(queryClient)

    act(function startDownload() {
      result.current.mutate({ _id: "book-a", links: [] })
    })

    expect(await screen.findByText("book-a")).toBeDefined()

    act(function settleDownload() {
      findPendingBookDownload(queryClient, "book-a")?.settlement.resolve()
    })

    await waitFor(function waitForDownloadSettled() {
      expect(result.current.isSuccess).toBe(true)
    })
    await waitFor(function waitForItemRemoved() {
      expect(screen.queryByText("book-a")).toBeNull()
    })
  })

  it("cancels the download of the given book only", async () => {
    const queryClient = new QueryClient()
    const { result } = renderDownloadFlow(queryClient)

    act(function startDownloads() {
      result.current.mutate({ _id: "book-a", links: [] })
      result.current.mutate({ _id: "book-b", links: [] })
    })

    await screen.findByText("book-b")

    cancelPluginDownloadFlow({ bookId: "book-b", queryClient })

    expect(
      findPendingBookDownload(queryClient, "book-b")?.abortController.signal
        .aborted,
    ).toBe(true)
    expect(
      findPendingBookDownload(queryClient, "book-a")?.abortController.signal
        .aborted,
    ).toBe(false)
  })
})
