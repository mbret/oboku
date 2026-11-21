import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { describe, expect, it, onTestFinished } from "vitest"
import { useWriteAnnotation } from "../annotations/useWriteAnnotation"
import { useAddTagToBook, useRemoveTagFromBook } from "../books/helpers"
import { useCollectionIncrementalModify } from "../collections/useCollectionIncrementalModify"
import { useCreateCollection } from "../collections/useCreateCollection"
import { useRemoveCollection } from "../collections/useRemoveCollection"
import { useSetCatalogEnabled } from "../integrations/catalogs/useSetCatalogEnabled"
import { useCreateTag, useUpdateTag } from "../tags/helpers"
import { useDatabase } from "./RxDbProvider"

const BOOK_ID = "book-1"

const renderWritesWithoutDatabase = () => {
  const queryClient = new QueryClient()
  const { result, unmount } = renderHook(
    function renderWriteHooks() {
      return {
        database: useDatabase(),
        createCollection: useCreateCollection(),
        removeCollection: useRemoveCollection(),
        modifyCollection: useCollectionIncrementalModify(),
        createTag: useCreateTag(),
        updateTag: useUpdateTag(),
        addTagToBook: useAddTagToBook(),
        removeTagFromBook: useRemoveTagFromBook(),
        setCatalogEnabled: useSetCatalogEnabled(),
        writeAnnotation: useWriteAnnotation({ bookId: BOOK_ID }),
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

  return result
}

describe("database writes", () => {
  it("reject while no database is open", async () => {
    const result = renderWritesWithoutDatabase()
    const writes = result.current
    const tagId = crypto.randomUUID()
    const collectionId = crypto.randomUUID()
    const annotationId = crypto.randomUUID()

    expect(writes.database.db).toBeUndefined()

    const results = await Promise.allSettled([
      writes.createCollection.mutateAsync({ name: "Collection" }),
      writes.removeCollection.mutateAsync({ _id: collectionId }),
      writes.modifyCollection.mutateAsync({ _id: collectionId, name: "New" }),
      writes.createTag.mutateAsync({ name: "Tag" }),
      writes.updateTag.mutateAsync({ _id: tagId, name: "New" }),
      writes.addTagToBook.mutateAsync({ _id: BOOK_ID, tagId }),
      writes.removeTagFromBook.mutateAsync({ _id: BOOK_ID, tagId }),
      writes.setCatalogEnabled.mutateAsync({
        id: "openLibrary",
        isEnabled: false,
      }),
      writes.writeAnnotation.mutateAsync({
        type: "create",
        annotation: { id: annotationId, cfi: "epubcfi(/6/4!/4/2/1:0)" },
      }),
      writes.writeAnnotation.mutateAsync({
        type: "update",
        annotation: { id: annotationId, notes: "" },
      }),
      writes.writeAnnotation.mutateAsync({ type: "remove", id: annotationId }),
    ])

    expect(
      results.map((settled) =>
        settled.status === "rejected" && settled.reason instanceof Error
          ? settled.reason.message
          : settled.status,
      ),
    ).toEqual(Array(results.length).fill("The database is not open"))
  })
})
