import { useQuery } from "@tanstack/react-query"
import { cleanup, render, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const { notifyError } = vi.hoisted(function createToastMocks() {
  return { notifyError: vi.fn() }
})

vi.mock("../notifications/toasts", async function mockToasts(importOriginal) {
  return {
    ...(await importOriginal<typeof import("../notifications/toasts")>()),
    notifyError,
  }
})

import { HttpApiClientWeb } from "../http/HttpClientApi.web"
import { HttpClientApiContext } from "../http/HttpClientApiContext"
import { QueryClientProvider } from "./QueryClientProvider"

const notifiedQueryError = new Error("notified query failed")
const silentQueryError = new Error("silent query failed")

function FailingQueries() {
  const { isError: hasNotifiedQueryFailed } = useQuery({
    queryKey: ["test", "notified"],
    queryFn: function failNotifiedQuery() {
      return Promise.reject(notifiedQueryError)
    },
    retry: false,
    meta: { notifyErrors: true },
  })
  const { isError: hasSilentQueryFailed } = useQuery({
    queryKey: ["test", "silent"],
    queryFn: function failSilentQuery() {
      return Promise.reject(silentQueryError)
    },
    retry: false,
  })

  return hasNotifiedQueryFailed && hasSilentQueryFailed ? "both failed" : null
}

describe("QueryClientProvider", () => {
  afterEach(function unmountProvider() {
    cleanup()
    notifyError.mockClear()
  })

  it("shows the error toast for a failing query only when it sets meta.notifyErrors", async () => {
    const { getByText } = render(
      <HttpClientApiContext.Provider value={new HttpApiClientWeb()}>
        <QueryClientProvider>
          <FailingQueries />
        </QueryClientProvider>
      </HttpClientApiContext.Provider>,
    )

    await waitFor(function waitForBothQueriesFailed() {
      expect(getByText("both failed")).toBeDefined()
    })
    expect(notifyError).toHaveBeenCalledExactlyOnceWith(notifiedQueryError)
  })
})
