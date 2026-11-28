import { createBookDefaults } from "@oboku/shared"
import { renderHook } from "@testing-library/react"
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

import { openAppTestDatabase } from "../rxdb/appDatabase.fixture"
import { useRequestBookSourceCredentials } from "./useRequestBookSourceCredentials"

const WEBDAV_LINK_DATA = { connectorId: "koofr", filePath: "/Books/Emma.pdf" }
const WEBDAV_CREDENTIALS = { password: "koofr-app-password" }

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

  it("gives the credentials the source of the book's first file gives", async () => {
    const { database, requestBookSourceCredentials } =
      await renderUseRequestBookSourceCredentials()
    const link = await database.link.safeInsert({
      type: "webdav",
      data: WEBDAV_LINK_DATA,
      book: null,
      createdAt: new Date().toISOString(),
      modifiedAt: null,
    })
    const book = await database.book.post({
      ...createBookDefaults(),
      links: [link._id],
    })

    const sourceCredentials = await requestBookSourceCredentials(book._id)

    expect(sourceCredentials).toEqual({
      providerCredentials: WEBDAV_CREDENTIALS,
    })
    expect(mocks.requestSourceCredentials).toHaveBeenCalledWith({
      linkId: link._id,
      linkType: "webdav",
      linkData: WEBDAV_LINK_DATA,
    })
  })

  it.each([
    ["a book with no file", { ...createBookDefaults(), links: [] }],
    [
      "a book whose file the device does not hold",
      { ...createBookDefaults(), links: ["missing-link"] },
    ],
  ])("gives none for %s, asking no source", async (_case, book) => {
    const { database, requestBookSourceCredentials } =
      await renderUseRequestBookSourceCredentials()
    const storedBook = await database.book.post(book)

    expect(await requestBookSourceCredentials(storedBook._id)).toBeUndefined()
    expect(mocks.requestSourceCredentials).not.toHaveBeenCalled()
  })

  it("gives none for a book the device does not hold", async () => {
    const { requestBookSourceCredentials } =
      await renderUseRequestBookSourceCredentials()

    expect(await requestBookSourceCredentials("missing-book")).toBeUndefined()
  })

  it("leaves the global error toast of the source's sign-in to its caller", async () => {
    const meta = { suppressGlobalErrorToast: true }

    await renderUseRequestBookSourceCredentials({ meta })

    expect(mocks.usePluginRefreshMetadata).toHaveBeenCalledWith({ meta })
  })
})
