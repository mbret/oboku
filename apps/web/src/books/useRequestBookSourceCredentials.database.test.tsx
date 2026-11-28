import { createBookDefaults } from "@oboku/shared"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, onTestFinished, vi } from "vitest"

const mocks = vi.hoisted(function createBookSourceCredentialsMocks() {
  return {
    usePluginRefreshMetadata: vi.fn(),
    requestSourceCredentials: vi.fn(),
  }
})

vi.mock(
  "../integrations/plugins/usePluginRefreshMetadata",
  function mockCredentials() {
    return { usePluginRefreshMetadata: mocks.usePluginRefreshMetadata }
  },
)

import { CancelError } from "../errors/errors.shared"
import { openAppTestDatabase } from "../rxdb/appDatabase.fixture"
import { useRequestBookSourceCredentials } from "./useRequestBookSourceCredentials"

const WEBDAV_LINK_DATA = { connectorId: "koofr", filePath: "/Books/Emma.pdf" }
const WEBDAV_CREDENTIALS = { password: "koofr-app-password" }
const DRIVE_LINK_DATA = { fileId: "drive-file-dune" }

type AppDatabase = Awaited<ReturnType<typeof openAppTestDatabase>>["database"]

const renderUseRequestBookSourceCredentials = async (
  options?: Parameters<typeof useRequestBookSourceCredentials>[0],
) => {
  const { database, wrapper } = await openAppTestDatabase()
  const { result, unmount } = renderHook(
    function renderHookWithOptions() {
      return useRequestBookSourceCredentials(options)
    },
    { wrapper },
  )
  onTestFinished(unmount)

  return { database, requestBookSourceCredentials: result.current }
}

const storeWebdavLink = (database: AppDatabase) =>
  database.link.safeInsert({
    type: "webdav",
    data: WEBDAV_LINK_DATA,
    book: null,
    createdAt: new Date().toISOString(),
    modifiedAt: null,
  })

const storeDriveLink = (database: AppDatabase) =>
  database.link.safeInsert({
    type: "DRIVE",
    data: DRIVE_LINK_DATA,
    book: null,
    createdAt: new Date().toISOString(),
    modifiedAt: null,
  })

const storeAnotherBookWithFile = async (database: AppDatabase) => {
  const link = await storeDriveLink(database)

  await database.book.post({ ...createBookDefaults(), links: [link._id] })
}

describe("useRequestBookSourceCredentials", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.usePluginRefreshMetadata.mockReturnValue(
      mocks.requestSourceCredentials,
    )
    mocks.requestSourceCredentials.mockResolvedValue({
      providerCredentials: WEBDAV_CREDENTIALS,
    })
  })

  it("asks the source of the book's first file, and gives its credentials", async () => {
    const { database, requestBookSourceCredentials } =
      await renderUseRequestBookSourceCredentials()
    const firstLink = await storeWebdavLink(database)
    const secondLink = await storeDriveLink(database)
    const book = await database.book.post({
      ...createBookDefaults(),
      links: [firstLink._id, secondLink._id],
    })

    const credentials = await requestBookSourceCredentials(book._id)

    expect(credentials).toEqual(WEBDAV_CREDENTIALS)
    expect(mocks.requestSourceCredentials.mock.calls).toEqual([
      [{ linkType: "webdav", linkData: WEBDAV_LINK_DATA }],
    ])
  })

  it.each([
    ["a book with no file", { ...createBookDefaults(), links: [] }],
    [
      "a book whose file is not in the database",
      { ...createBookDefaults(), links: ["missing-link"] },
    ],
  ])("gives none for %s, asking no source", async (_case, book) => {
    const { database, requestBookSourceCredentials } =
      await renderUseRequestBookSourceCredentials()
    await storeAnotherBookWithFile(database)
    const storedBook = await database.book.post(book)

    expect(await requestBookSourceCredentials(storedBook._id)).toBeUndefined()
    expect(mocks.requestSourceCredentials).not.toHaveBeenCalled()
  })

  it("gives none for a book that is not in the database, asking no source", async () => {
    const { database, requestBookSourceCredentials } =
      await renderUseRequestBookSourceCredentials()
    await storeAnotherBookWithFile(database)

    expect(await requestBookSourceCredentials("missing-book")).toBeUndefined()
    expect(mocks.requestSourceCredentials).not.toHaveBeenCalled()
  })

  it("rejects with what the source rejects with", async () => {
    const { database, requestBookSourceCredentials } =
      await renderUseRequestBookSourceCredentials()
    const link = await storeWebdavLink(database)
    const book = await database.book.post({
      ...createBookDefaults(),
      links: [link._id],
    })
    const closedPrompt = new CancelError()
    mocks.requestSourceCredentials.mockRejectedValue(closedPrompt)

    await expect(requestBookSourceCredentials(book._id)).rejects.toBe(
      closedPrompt,
    )
  })

  it("rejects while no database is open", async () => {
    const queryClient = new QueryClient()
    const { result, unmount } = renderHook(useRequestBookSourceCredentials, {
      wrapper: function QueryWrapper({ children }: { children: ReactNode }) {
        return (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        )
      },
    })
    onTestFinished(unmount)

    await expect(result.current("book-dune")).rejects.toThrow(
      "The database is not open",
    )
    expect(mocks.requestSourceCredentials).not.toHaveBeenCalled()
  })

  it("leaves the global error toast of the source's request to its caller", async () => {
    const meta = { suppressGlobalErrorToast: true }

    await renderUseRequestBookSourceCredentials({ meta })

    expect(mocks.usePluginRefreshMetadata).toHaveBeenCalledWith({ meta })
  })
})
