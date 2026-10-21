import { createBookDefaults, type GoogleDriveLinkData } from "@oboku/shared"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { firstValueFrom } from "rxjs"
import { describe, expect, it, onTestFinished } from "vitest"
import type { Database } from "../rxdb"
import { getLatestDatabase, useReCreateDb } from "../rxdb/RxDbProvider"
import { useUpsertLink } from "./useUpsertLink"

const FIRST_FILE: GoogleDriveLinkData = { fileId: "first-file" }
const SECOND_FILE: GoogleDriveLinkData = { fileId: "second-file" }

async function renderUpsertLinkWithDatabase() {
  const queryClient = new QueryClient()
  const { result, unmount } = renderHook(
    function renderUseReCreateDbAndUseUpsertLink() {
      return { reCreateDb: useReCreateDb(), upsertLink: useUpsertLink() }
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
  const db = await firstValueFrom(getLatestDatabase())
  onTestFinished(async function removeDatabase() {
    await db.remove()
  })

  return { db, upsertLink: result.current.upsertLink.mutateAsync }
}

async function seedBookLinkedToFirstFile(db: Database) {
  const book = await db.book.post(createBookDefaults())
  const link = await db.link.safeInsert({
    type: "DRIVE",
    data: FIRST_FILE,
    book: book._id,
    createdAt: new Date().toISOString(),
    modifiedAt: null,
  })
  await book.incrementalPatch({ links: [link._id] })

  return { bookId: book._id, firstLinkId: link._id }
}

describe("useUpsertLink", () => {
  it("switches a book back to a file it used before", async () => {
    const { db, upsertLink } = await renderUpsertLinkWithDatabase()
    const { bookId, firstLinkId } = await seedBookLinkedToFirstFile(db)

    await upsertLink({ bookId, type: "DRIVE", data: SECOND_FILE })
    await upsertLink({ bookId, type: "DRIVE", data: FIRST_FILE })

    const book = await db.book.findOne(bookId).exec()

    expect(book?.links).toEqual([firstLinkId])
  })

  it("inserts one link for a file the book never used and makes it the book's file", async () => {
    const { db, upsertLink } = await renderUpsertLinkWithDatabase()
    const { bookId } = await seedBookLinkedToFirstFile(db)

    await upsertLink({ bookId, type: "DRIVE", data: SECOND_FILE })

    const secondFileLinks = await db.link
      .find({ selector: { data: SECOND_FILE, book: bookId } })
      .exec()
    const book = await db.book.findOne(bookId).exec()

    expect(secondFileLinks).toHaveLength(1)
    expect(book?.links).toEqual(secondFileLinks.map((link) => link._id))
  })
})
