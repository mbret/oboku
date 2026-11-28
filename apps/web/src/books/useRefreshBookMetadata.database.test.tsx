import { createBookDefaults } from "@oboku/shared"
import { renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, onTestFinished, vi } from "vitest"

const mocks = vi.hoisted(function createUseRefreshBookMetadataMocks() {
  return {
    usePluginRefreshMetadata: vi.fn(),
    requestSourceCredentials: vi.fn(),
    notifyError: vi.fn(),
    showDialog: vi.fn(),
    useNetworkState: vi.fn(),
  }
})

vi.mock(
  "../integrations/plugins/usePluginRefreshMetadata",
  function mockCredentials() {
    return { usePluginRefreshMetadata: mocks.usePluginRefreshMetadata }
  },
)

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

const DRIVE_LINK_DATA = { fileId: "drive-file-dune" }
const DRIVE_CREDENTIALS = { access_token: "drive-access-token" }

const renderUseRefreshBookMetadata = async () => {
  const { database, wrapper: DatabaseWrapper } = await openAppTestDatabase()
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

  return { database, post, refreshBookMetadata: result.current }
}

type AppDatabase = Awaited<ReturnType<typeof openAppTestDatabase>>["database"]

const storeDriveBook = async (database: AppDatabase) => {
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

const readBook = async (database: AppDatabase, bookId: string) =>
  (await database.book.findOne(bookId).exec())?.toJSON()

describe("useRefreshBookMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.usePluginRefreshMetadata.mockReturnValue(
      mocks.requestSourceCredentials,
    )
    mocks.requestSourceCredentials.mockResolvedValue({
      providerCredentials: DRIVE_CREDENTIALS,
    })
    mocks.useNetworkState.mockReturnValue({ online: true })
  })

  it("asks the server to refresh the book, with the credentials of the source of its file, and marks the book as fetching", async () => {
    const { database, post, refreshBookMetadata } =
      await renderUseRefreshBookMetadata()
    const { book, link } = await storeDriveBook(database)

    await refreshBookMetadata(book._id, { force: true })

    expect(mocks.requestSourceCredentials).toHaveBeenCalledWith({
      linkId: link._id,
      linkType: "DRIVE",
      linkData: DRIVE_LINK_DATA,
    })
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

  it("asks no source and no server for a book with no file, and shows no error", async () => {
    const { database, post, refreshBookMetadata } =
      await renderUseRefreshBookMetadata()
    const book = await database.book.post(createBookDefaults())

    await refreshBookMetadata(book._id)

    expect(mocks.requestSourceCredentials).not.toHaveBeenCalled()
    expect(post).not.toHaveBeenCalled()
    expect(mocks.notifyError).not.toHaveBeenCalled()
  })

  it("marks the refresh as failed on the book and tells the user when the server refuses", async () => {
    const { database, post, refreshBookMetadata } =
      await renderUseRefreshBookMetadata()
    const { book } = await storeDriveBook(database)
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
    const { database, post, refreshBookMetadata } =
      await renderUseRefreshBookMetadata()
    const { book } = await storeDriveBook(database)
    mocks.requestSourceCredentials.mockRejectedValue(new CancelError())

    await refreshBookMetadata(book._id)

    expect(post).not.toHaveBeenCalled()
    expect(mocks.notifyError).not.toHaveBeenCalled()
    expect(await readBook(database, book._id)).toMatchObject({
      metadataUpdateStatus: null,
    })
  })

  it("shows the offline dialog, and asks no source, while the device is offline", async () => {
    mocks.useNetworkState.mockReturnValue({ online: false })
    const { database, post, refreshBookMetadata } =
      await renderUseRefreshBookMetadata()
    const { book } = await storeDriveBook(database)

    await refreshBookMetadata(book._id)

    expect(mocks.showDialog).toHaveBeenCalledTimes(1)
    expect(mocks.requestSourceCredentials).not.toHaveBeenCalled()
    expect(post).not.toHaveBeenCalled()
  })
})
