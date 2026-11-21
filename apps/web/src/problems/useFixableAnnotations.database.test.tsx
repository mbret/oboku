import { createBookDefaults } from "@oboku/shared"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { removeRxDatabase } from "rxdb"
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie"
import { firstValueFrom } from "rxjs"
import { describe, expect, it, onTestFinished } from "vitest"
import { RXDB_DATABASE_NAME } from "../rxdb/constants.shared"
import { getLatestDatabase, useReCreateDb } from "../rxdb/RxDbProvider"
import { useFixableAnnotations } from "./useFixableAnnotations"

async function renderFixableAnnotationsWithDatabase() {
  await removeRxDatabase(RXDB_DATABASE_NAME, getRxStorageDexie())

  const queryClient = new QueryClient()
  const { result, unmount } = renderHook(
    function renderUseReCreateDbAndUseFixableAnnotations() {
      return {
        reCreateDb: useReCreateDb(),
        fixableAnnotations: useFixableAnnotations(),
      }
    },
    {
      wrapper: function QueryWrapper({ children }: { children: ReactNode }) {
        return (
          <QueryClientProvider client={queryClient}>
            {children}
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

  const insertAnnotationOf = async (bookId: string) => {
    const annotation = await database.annotation.insert({
      _id: crypto.randomUUID(),
      rx_model: "annotation",
      bookId,
      cfi: "epubcfi(/6/4!/4/2/1:0)",
      createdAt: new Date().toISOString(),
      modifiedAt: null,
    })

    return annotation._id
  }

  return {
    database,
    insertAnnotationOf,
    readDanglingAnnotations: () =>
      result.current.fixableAnnotations.danglingAnnotations,
  }
}

describe("useFixableAnnotations", () => {
  it("lists the annotations whose book no longer exists, and only them", async () => {
    const { database, insertAnnotationOf, readDanglingAnnotations } =
      await renderFixableAnnotationsWithDatabase()
    const book = await database.book.post(createBookDefaults())
    await insertAnnotationOf(book._id)
    const danglingAnnotationId = await insertAnnotationOf(
      "book-removed-on-another-device",
    )

    await waitFor(() => {
      expect(readDanglingAnnotations()).toEqual([danglingAnnotationId])
    })
  })

  it("leaves out the annotations of a protected book", async () => {
    const { database, insertAnnotationOf, readDanglingAnnotations } =
      await renderFixableAnnotationsWithDatabase()
    const protectedTag = await database.tag.insertSafe({
      name: "Private",
      books: [],
      isProtected: true,
      createdAt: new Date().toISOString(),
      modifiedAt: null,
    })
    const protectedBook = await database.book.post({
      ...createBookDefaults(),
      tags: [protectedTag._id],
    })
    await insertAnnotationOf(protectedBook._id)
    const danglingAnnotationId = await insertAnnotationOf(
      "book-removed-on-another-device",
    )

    await waitFor(() => {
      expect(readDanglingAnnotations()).toEqual([danglingAnnotationId])
    })
  })
})
