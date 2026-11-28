import { ObokuErrorCode } from "@oboku/shared"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(function createUseSendBookToKindleMocks() {
  return {
    useDatabase: vi.fn(),
    useRequestBookSourceCredentials: vi.fn(),
    requestBookSourceCredentials: vi.fn(),
    notify: vi.fn(),
    useNetworkState: vi.fn(),
    awaitDocumentsPushed: vi.fn(),
  }
})

vi.mock(
  "../../rxdb/replication/awaitDocumentsPushed",
  function mockDocumentsPush() {
    return { awaitDocumentsPushed: mocks.awaitDocumentsPushed }
  },
)

vi.mock("react-use", async function mockNetworkState(importOriginal) {
  return {
    ...(await importOriginal<typeof import("react-use")>()),
    useNetworkState: mocks.useNetworkState,
  }
})

vi.mock("../../rxdb", async function mockRxdb() {
  const { ensureDatabase } = await import("../../rxdb/RxDbProvider")

  return { useDatabase: mocks.useDatabase, ensureDatabase }
})

vi.mock(
  "../../books/useRequestBookSourceCredentials",
  function mockCredentials() {
    return {
      useRequestBookSourceCredentials: mocks.useRequestBookSourceCredentials,
    }
  },
)

vi.mock("../../notifications/toasts", function mockToasts() {
  return { notify: mocks.notify }
})

import { OfflineError } from "../../errors/errors.shared"
import { HttpClientApiContext } from "../../http"
import type { HttpApiClientWeb } from "../../http/HttpClientApi.web"
import { activateLocale } from "../../i18n/activateLocale"
import { openTestDatabase } from "../../rxdb/databases.fixture"
import { useSendBookToKindle } from "./useSendBookToKindle"

const BOOK_ID = "book-dune"
const DRIVE_CREDENTIALS = { access_token: "drive-access-token" }

const renderUseSendBookToKindle = async (
  options?: Parameters<typeof useSendBookToKindle>[0],
) => {
  const database = await openTestDatabase()
  const post = vi.fn().mockResolvedValue({ data: {} })
  // test double: the mutation only calls the generated client's `post`
  const client = { sdkClient: { post } } as unknown as HttpApiClientWeb
  const queryClient = new QueryClient()
  mocks.useDatabase.mockReturnValue({ db: database })

  const { result, unmount } = renderHook(() => useSendBookToKindle(options), {
    wrapper: function Providers({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <HttpClientApiContext.Provider value={client}>
            {children}
          </HttpClientApiContext.Provider>
        </QueryClientProvider>
      )
    },
  })

  return { post, queryClient, result, unmount }
}

describe("useSendBookToKindle", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mocks.useRequestBookSourceCredentials.mockReturnValue(
      mocks.requestBookSourceCredentials,
    )
    mocks.requestBookSourceCredentials.mockResolvedValue(DRIVE_CREDENTIALS)
    mocks.useNetworkState.mockReturnValue({ online: true })
    mocks.awaitDocumentsPushed.mockResolvedValue(undefined)
    await activateLocale("en")
  })

  it("asks the server to send the book, with the credentials of the source of its file", async () => {
    const { post, result } = await renderUseSendBookToKindle()

    await result.current.mutateAsync({ bookId: BOOK_ID })

    expect(mocks.requestBookSourceCredentials).toHaveBeenCalledWith(BOOK_ID)
    expect(post).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/kindle/send",
        body: { bookId: BOOK_ID, providerCredentials: DRIVE_CREDENTIALS },
      }),
    )
  })

  it("tells the user when the send starts, then that the book is on its way", async () => {
    const { result } = await renderUseSendBookToKindle()

    await result.current.mutateAsync({ bookId: BOOK_ID })

    expect(mocks.notify.mock.calls).toEqual([
      [expect.objectContaining({ severity: "info" })],
      [
        expect.objectContaining({
          severity: "success",
          description:
            "The book is on its way. Amazon delivers it to your Kindle in a few minutes.",
        }),
      ],
    ])
  })

  it("sends nothing, and does not say the book is on its way, when the source gives no credentials", async () => {
    const { post, result } = await renderUseSendBookToKindle()
    const signInFailure = new Error("The sign-in was closed")
    mocks.requestBookSourceCredentials.mockRejectedValue(signInFailure)

    await expect(result.current.mutateAsync({ bookId: BOOK_ID })).rejects.toBe(
      signInFailure,
    )

    expect(post).not.toHaveBeenCalled()
    expect(mocks.notify).not.toHaveBeenCalled()
  })

  it("does not say the book is on its way when the server refuses the send", async () => {
    const { post, result } = await renderUseSendBookToKindle()
    const refusal = new Error("413")
    post.mockRejectedValue(refusal)

    await expect(result.current.mutateAsync({ bookId: BOOK_ID })).rejects.toBe(
      refusal,
    )

    expect(mocks.notify).not.toHaveBeenCalledWith(
      expect.objectContaining({ severity: "success" }),
    )
  })

  it("still tells that the book is on its way when its caller unmounted during the send", async () => {
    const { post, result, unmount } = await renderUseSendBookToKindle()
    const heldSend = Promise.withResolvers<{ data: object }>()
    post.mockReturnValue(heldSend.promise)

    result.current.mutate({ bookId: BOOK_ID })
    await vi.waitFor(() => expect(post).toHaveBeenCalled())
    unmount()
    heldSend.resolve({ data: {} })

    await vi.waitFor(() =>
      expect(mocks.notify).toHaveBeenCalledWith(
        expect.objectContaining({ severity: "success" }),
      ),
    )
  })

  it("asks for the send only once the settings, which hold the Kindle address, reached the server", async () => {
    const { post, result } = await renderUseSendBookToKindle()
    const settingsPush = Promise.withResolvers<void>()
    mocks.awaitDocumentsPushed.mockReturnValue(settingsPush.promise)

    const send = result.current.mutateAsync({ bookId: BOOK_ID })
    await vi.waitFor(() =>
      expect(mocks.awaitDocumentsPushed).toHaveBeenCalled(),
    )

    const pushedDocuments = mocks.awaitDocumentsPushed.mock.calls[0]?.[0]

    expect(pushedDocuments).toHaveLength(1)
    expect(pushedDocuments?.[0]?.primary).toBe("settings")
    expect(post).not.toHaveBeenCalled()

    settingsPush.resolve()
    await send

    expect(post).toHaveBeenCalledTimes(1)
  })

  it("sends nothing, and says why, when the settings do not reach the server", async () => {
    const { post, result } = await renderUseSendBookToKindle()
    mocks.awaitDocumentsPushed.mockRejectedValue(new Error("timeout"))

    await expect(
      result.current.mutateAsync({ bookId: BOOK_ID }),
    ).rejects.toThrow(
      "Your Kindle address has not reached oboku's server yet. Check your connection, then send again.",
    )

    expect(post).not.toHaveBeenCalled()
    expect(mocks.notify).not.toHaveBeenCalled()
  })

  it("fails while the device is offline, asking no credentials and sending nothing", async () => {
    mocks.useNetworkState.mockReturnValue({ online: false })
    const { post, result } = await renderUseSendBookToKindle()

    await expect(
      result.current.mutateAsync({ bookId: BOOK_ID }),
    ).rejects.toBeInstanceOf(OfflineError)

    expect(mocks.requestBookSourceCredentials).not.toHaveBeenCalled()
    expect(post).not.toHaveBeenCalled()
  })

  it("fails for a book whose file is not in the database, sending nothing", async () => {
    const { post, result } = await renderUseSendBookToKindle()
    mocks.requestBookSourceCredentials.mockResolvedValue(undefined)

    await expect(
      result.current.mutateAsync({ bookId: BOOK_ID }),
    ).rejects.toMatchObject({ code: ObokuErrorCode.ERROR_NO_LINK })

    expect(post).not.toHaveBeenCalled()
    expect(mocks.notify).not.toHaveBeenCalled()
  })

  it("keeps the global error toast for its caller to decide, and takes the source's errors as its own", async () => {
    const meta = { suppressGlobalErrorToast: true }
    const { queryClient, result } = await renderUseSendBookToKindle({ meta })

    await result.current.mutateAsync({ bookId: BOOK_ID })

    expect(mocks.useRequestBookSourceCredentials).toHaveBeenCalledWith({
      meta: { suppressGlobalErrorToast: true },
    })
    expect(queryClient.getMutationCache().getAll()[0]?.options.meta).toBe(meta)
  })
})
