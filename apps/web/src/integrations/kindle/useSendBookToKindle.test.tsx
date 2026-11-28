import { createBookDefaults, ObokuErrorCode } from "@oboku/shared"
import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(function createUseSendBookToKindleMocks() {
  return {
    useDatabase: vi.fn(),
    usePluginRefreshMetadata: vi.fn(),
    requestSourceCredentials: vi.fn(),
    notify: vi.fn(),
    useNetworkState: vi.fn(),
  }
})

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

vi.mock("../plugins/usePluginRefreshMetadata", function mockCredentials() {
  return { usePluginRefreshMetadata: mocks.usePluginRefreshMetadata }
})

vi.mock("../../notifications/toasts", function mockToasts() {
  return { notify: mocks.notify }
})

import { OfflineError } from "../../errors/errors.shared"
import { HttpClientApiContext } from "../../http"
import type { HttpApiClientWeb } from "../../http/HttpClientApi.web"
import { activateLocale } from "../../i18n/activateLocale"
import { openTestDatabase } from "../../rxdb/databases.fixture"
import { useSendBookToKindle } from "./useSendBookToKindle"

const DRIVE_LINK_DATA = { fileId: "drive-file-dune" }
const DRIVE_CREDENTIALS = { access_token: "drive-access-token" }

const renderUseSendBookToKindle = async (
  options?: Parameters<typeof useSendBookToKindle>[0],
) => {
  const database = await openTestDatabase()
  const post = vi.fn().mockResolvedValue({ data: {} })
  // test double: the mutation only calls the generated client's `post`
  const client = { sdkClient: { post } } as unknown as HttpApiClientWeb
  const reportMutationError = vi.fn()
  const queryClient = new QueryClient({
    mutationCache: new MutationCache({ onError: reportMutationError }),
  })
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

  return { database, post, queryClient, reportMutationError, result, unmount }
}

const storeDriveBook = async (
  database: Awaited<ReturnType<typeof openTestDatabase>>,
) => {
  const link = await database.link.safeInsert({
    type: "DRIVE",
    data: DRIVE_LINK_DATA,
    book: null,
    createdAt: new Date().toISOString(),
    modifiedAt: null,
  })
  const book = await database.book.post({
    ...createBookDefaults(),
    links: [link._id],
  })

  return { book, link }
}

describe("useSendBookToKindle", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mocks.usePluginRefreshMetadata.mockReturnValue(
      mocks.requestSourceCredentials,
    )
    mocks.requestSourceCredentials.mockResolvedValue({
      providerCredentials: DRIVE_CREDENTIALS,
    })
    mocks.useNetworkState.mockReturnValue({ online: true })
    await activateLocale("en")
  })

  it("asks the server to send the book, with the credentials of the source of its file", async () => {
    const { database, post, result } = await renderUseSendBookToKindle()
    const { book, link } = await storeDriveBook(database)

    await result.current.mutateAsync({ bookId: book._id })

    expect(mocks.requestSourceCredentials).toHaveBeenCalledWith({
      linkId: link._id,
      linkType: "DRIVE",
      linkData: DRIVE_LINK_DATA,
    })
    expect(post).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/kindle/send",
        body: { bookId: book._id, providerCredentials: DRIVE_CREDENTIALS },
      }),
    )
  })

  it("tells the user when the send starts, then that the book is on its way", async () => {
    const { database, result } = await renderUseSendBookToKindle()
    const { book } = await storeDriveBook(database)

    await result.current.mutateAsync({ bookId: book._id })

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
    const { database, post, result } = await renderUseSendBookToKindle()
    const { book } = await storeDriveBook(database)
    const signInFailure = new Error("The sign-in was closed")
    mocks.requestSourceCredentials.mockRejectedValue(signInFailure)

    await expect(result.current.mutateAsync({ bookId: book._id })).rejects.toBe(
      signInFailure,
    )

    expect(post).not.toHaveBeenCalled()
    expect(mocks.notify).not.toHaveBeenCalled()
  })

  it("does not say the book is on its way when the server refuses the send", async () => {
    const { database, post, result } = await renderUseSendBookToKindle()
    const { book } = await storeDriveBook(database)
    const refusal = new Error("413")
    post.mockRejectedValue(refusal)

    await expect(result.current.mutateAsync({ bookId: book._id })).rejects.toBe(
      refusal,
    )

    expect(mocks.notify).not.toHaveBeenCalledWith(
      expect.objectContaining({ severity: "success" }),
    )
  })

  it("still tells that the book is on its way when its caller unmounted during the send", async () => {
    const { database, post, result, unmount } =
      await renderUseSendBookToKindle()
    const { book } = await storeDriveBook(database)
    const heldSend = Promise.withResolvers<{ data: object }>()
    post.mockReturnValue(heldSend.promise)

    result.current.mutate({ bookId: book._id })
    await vi.waitFor(() => expect(post).toHaveBeenCalled())
    unmount()
    heldSend.resolve({ data: {} })

    await vi.waitFor(() =>
      expect(mocks.notify).toHaveBeenCalledWith(
        expect.objectContaining({ severity: "success" }),
      ),
    )
  })

  it("still reports a refused send to the app's mutation error handler when its caller unmounted during the send", async () => {
    const { database, post, reportMutationError, result, unmount } =
      await renderUseSendBookToKindle()
    const { book } = await storeDriveBook(database)
    const heldSend = Promise.withResolvers<{ data: object }>()
    const refusal = new Error("413")
    post.mockReturnValue(heldSend.promise)

    result.current.mutate({ bookId: book._id })
    await vi.waitFor(() => expect(post).toHaveBeenCalled())
    unmount()
    heldSend.reject(refusal)

    await vi.waitFor(() =>
      expect(reportMutationError.mock.calls[0]?.[0]).toBe(refusal),
    )
    expect(mocks.notify).not.toHaveBeenCalledWith(
      expect.objectContaining({ severity: "success" }),
    )
  })

  it("fails while the device is offline, asking no credentials and sending nothing", async () => {
    mocks.useNetworkState.mockReturnValue({ online: false })
    const { database, post, result } = await renderUseSendBookToKindle()
    const { book } = await storeDriveBook(database)

    await expect(
      result.current.mutateAsync({ bookId: book._id }),
    ).rejects.toBeInstanceOf(OfflineError)

    expect(mocks.requestSourceCredentials).not.toHaveBeenCalled()
    expect(post).not.toHaveBeenCalled()
  })

  it("fails for a book with no file, asking no credentials", async () => {
    const { database, post, result } = await renderUseSendBookToKindle()
    const book = await database.book.post(createBookDefaults())

    await expect(
      result.current.mutateAsync({ bookId: book._id }),
    ).rejects.toMatchObject({ code: ObokuErrorCode.ERROR_NO_LINK })

    expect(mocks.requestSourceCredentials).not.toHaveBeenCalled()
    expect(post).not.toHaveBeenCalled()
  })

  it("keeps the global error toast for its caller to decide, and takes the source's errors as its own", async () => {
    const meta = { suppressGlobalErrorToast: true }
    const { queryClient, database, result } = await renderUseSendBookToKindle({
      meta,
    })
    const { book } = await storeDriveBook(database)

    await result.current.mutateAsync({ bookId: book._id })

    expect(mocks.usePluginRefreshMetadata).toHaveBeenCalledWith({
      meta: { suppressGlobalErrorToast: true },
    })
    expect(queryClient.getMutationCache().getAll()[0]?.options.meta).toBe(meta)
  })
})
