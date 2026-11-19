import { createBookDefaults } from "@oboku/shared"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, renderHook, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { removeRxDatabase } from "rxdb"
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie"
import { firstValueFrom } from "rxjs"
import { describe, expect, it, onTestFinished, vi } from "vitest"
import { DialogProvider } from "../common/dialogs/DialogProvider"
import { RXDB_DATABASE_NAME } from "../rxdb/constants.shared"
import { getLatestDatabase, useReCreateDb } from "../rxdb/RxDbProvider"
import { useRemoveAllContents } from "./useRemoveAllContents"

const { reloadPage } = vi.hoisted(function createReloadPageSpy() {
  return { reloadPage: vi.fn() }
})

vi.mock("../common/browser/reloadPage", function mockReloadPage() {
  return { reloadPage }
})

async function renderRemoveAllContentsWithDatabase() {
  await removeRxDatabase(RXDB_DATABASE_NAME, getRxStorageDexie())

  const queryClient = new QueryClient()
  const { result, unmount } = renderHook(
    function renderUseReCreateDbAndUseRemoveAllContents() {
      return {
        reCreateDb: useReCreateDb(),
        removeAllContents: useRemoveAllContents(),
      }
    },
    {
      wrapper: function QueryAndDialogWrapper({
        children,
      }: {
        children: ReactNode
      }) {
        return (
          <QueryClientProvider client={queryClient}>
            <DialogProvider>{children}</DialogProvider>
          </QueryClientProvider>
        )
      },
    },
  )
  onTestFinished(unmount)

  await result.current.reCreateDb.mutateAsync({})
  const database = await firstValueFrom(getLatestDatabase())
  onTestFinished(async function removeDatabase() {
    await database.remove()
  })

  return {
    database,
    removeAllContents: result.current.removeAllContents.mutateAsync,
  }
}

describe("useRemoveAllContents", () => {
  it("removes the annotations of the books and those left without a book", async () => {
    const { database, removeAllContents } =
      await renderRemoveAllContentsWithDatabase()
    const book = await database.book.post(createBookDefaults())
    const insertAnnotationOf = (bookId: string) =>
      database.annotation.insert({
        _id: crypto.randomUUID(),
        rx_model: "annotation",
        bookId,
        cfi: "epubcfi(/6/4!/4/2/1:0)",
        createdAt: new Date().toISOString(),
        modifiedAt: null,
      })
    await insertAnnotationOf(book._id)
    await insertAnnotationOf("book-removed-on-another-device")

    const reset = removeAllContents()
    fireEvent.click(await screen.findByRole("button", { name: "Ok" }))
    await reset

    expect(reloadPage).toHaveBeenCalledOnce()
    expect(await database.annotation.count().exec()).toBe(0)
  })
})
