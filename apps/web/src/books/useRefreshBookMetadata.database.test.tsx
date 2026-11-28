import { createBookDefaults } from "@oboku/shared"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, onTestFinished, vi } from "vitest"

const mocks = vi.hoisted(function createUseRefreshBookMetadataMocks() {
  return {
    useRequestBookSourceCredentials: vi.fn(),
    requestBookSourceCredentials: vi.fn(),
    notifyError: vi.fn(),
    showDialog: vi.fn(),
    useNetworkState: vi.fn(),
  }
})

vi.mock("./useRequestBookSourceCredentials", function mockCredentials() {
  return {
    useRequestBookSourceCredentials: mocks.useRequestBookSourceCredentials,
  }
})

vi.mock("../notifications/toasts", async function mockToasts(importOriginal) {
  return {
    ...(await importOriginal<typeof import("../notifications/toasts")>()),
    notifyError: mocks.notifyError,
  }
})

vi.mock(
  "../common/dialogs/createDialog",
  async function mockDialogs(importOriginal) {
    return {
      ...(await importOriginal<
        typeof import("../common/dialogs/createDialog")
      >()),
      showDialog: mocks.showDialog,
    }
  },
)

vi.mock("react-use", async function mockNetworkState(importOriginal) {
  return {
    ...(await importOriginal<typeof import("react-use")>()),
    useNetworkState: mocks.useNetworkState,
  }
})

import { CancelError } from "../errors/errors.shared"
import { HttpClientApiContext } from "../http"
import type { HttpApiClientWeb } from "../http/HttpClientApi.web"
import { openAppTestDatabase } from "../rxdb/appDatabase.fixture"
import { useRefreshBookMetadata } from "./useRefreshBookMetadata"

const DRIVE_CREDENTIALS = { access_token: "drive-access-token" }

type AppDatabase = Awaited<ReturnType<typeof openAppTestDatabase>>["database"]

const renderUseRefreshBookMetadataUnder = (
  DatabaseWrapper: (props: { children: ReactNode }) => ReactNode,
) => {
  const post = vi.fn().mockResolvedValue({ data: {} })
  // test double: the hook only calls the generated client's `post`
  const client = { sdkClient: { post } } as unknown as HttpApiClientWeb

  const { result, unmount } = renderHook(useRefreshBookMetadata, {
    wrapper: function Providers({ children }: { children: ReactNode }) {
      return (
        <DatabaseWrapper>
          <HttpClientApiContext.Provider value={client}>
            {children}
          </HttpClientApiContext.Provider>
        </DatabaseWrapper>
      )
    },
  })
  onTestFinished(unmount)

  return { post, refreshBookMetadata: result.current }
}

const renderUseRefreshBookMetadata = async () => {
  const { database, wrapper } = await openAppTestDatabase()
  const book = await database.book.post(createBookDefaults())

  return { database, book, ...renderUseRefreshBookMetadataUnder(wrapper) }
}

const readBook = async (database: AppDatabase, bookId: string) =>
  (await database.book.findOne(bookId).exec())?.toJSON()

describe("useRefreshBookMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useRequestBookSourceCredentials.mockReturnValue(
      mocks.requestBookSourceCredentials,
    )
    mocks.requestBookSourceCredentials.mockResolvedValue(DRIVE_CREDENTIALS)
    mocks.useNetworkState.mockReturnValue({ online: true })
  })

  it("asks the server to refresh the book, with the credentials of the source of its file, and marks the book as fetching", async () => {
    const { database, book, post, refreshBookMetadata } =
      await renderUseRefreshBookMetadata()

    await refreshBookMetadata(book._id, { force: true })

    expect(mocks.requestBookSourceCredentials).toHaveBeenCalledWith(book._id)
    expect(post).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/books/metadata/refresh",
        body: {
          bookId: book._id,
          providerCredentials: DRIVE_CREDENTIALS,
          force: true,
        },
      }),
    )
    expect(await readBook(database, book._id)).toMatchObject({
      metadataUpdateStatus: "fetching",
    })
    expect(mocks.notifyError).not.toHaveBeenCalled()
  })

  it("asks no server, and shows no error, for a book whose file is not in the database", async () => {
    const { database, book, post, refreshBookMetadata } =
      await renderUseRefreshBookMetadata()
    mocks.requestBookSourceCredentials.mockResolvedValue(undefined)

    await refreshBookMetadata(book._id)

    expect(post).not.toHaveBeenCalled()
    expect(mocks.notifyError).not.toHaveBeenCalled()
    expect(await readBook(database, book._id)).toMatchObject({
      metadataUpdateStatus: null,
    })
  })

  it("marks the refresh as failed on the book and tells the user when the server refuses", async () => {
    const { database, book, post, refreshBookMetadata } =
      await renderUseRefreshBookMetadata()
    const refusal = new Error("502")
    post.mockRejectedValue(refusal)

    await refreshBookMetadata(book._id)

    expect(await readBook(database, book._id)).toMatchObject({
      metadataUpdateStatus: null,
      lastMetadataUpdateError: "unknown",
    })
    expect(mocks.notifyError).toHaveBeenCalledWith(refusal)
  })

  it("stays silent, and asks the server nothing, when the user cancels the sign-in of the source", async () => {
    const { database, book, post, refreshBookMetadata } =
      await renderUseRefreshBookMetadata()
    mocks.requestBookSourceCredentials.mockRejectedValue(new CancelError())

    await refreshBookMetadata(book._id)

    expect(post).not.toHaveBeenCalled()
    expect(mocks.notifyError).not.toHaveBeenCalled()
    expect(await readBook(database, book._id)).toMatchObject({
      metadataUpdateStatus: null,
    })
  })

  it("shows a dialog, and asks no source and no server, while the device is offline", async () => {
    mocks.useNetworkState.mockReturnValue({ online: false })
    const { book, post, refreshBookMetadata } =
      await renderUseRefreshBookMetadata()

    await refreshBookMetadata(book._id)

    expect(mocks.showDialog).toHaveBeenCalledTimes(1)
    expect(mocks.requestBookSourceCredentials).not.toHaveBeenCalled()
    expect(post).not.toHaveBeenCalled()
  })

  it("stays silent, and asks no source, while no database is open", async () => {
    const queryClient = new QueryClient()
    const { post, refreshBookMetadata } = renderUseRefreshBookMetadataUnder(
      function QueryWrapper({ children }: { children: ReactNode }) {
        return (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        )
      },
    )

    await refreshBookMetadata("book-dune")

    expect(mocks.requestBookSourceCredentials).not.toHaveBeenCalled()
    expect(post).not.toHaveBeenCalled()
    expect(mocks.notifyError).not.toHaveBeenCalled()
  })

  it("takes the errors of the source's request as its own, with no global error toast", async () => {
    await renderUseRefreshBookMetadata()

    expect(mocks.useRequestBookSourceCredentials).toHaveBeenCalledWith({
      meta: { suppressGlobalErrorToast: true },
    })
  })
})
