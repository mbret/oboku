// @vitest-environment jsdom

import { ReadingStateState } from "@oboku/shared"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { of } from "rxjs"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(function createMarkBookAsMocks() {
  const incrementalPatch = vi.fn(async function patchFakeBook(
    patch: Record<string, unknown>,
  ) {
    return patch
  })

  return { incrementalPatch }
})

vi.mock("../rxdb/RxDbProvider", function mockRxDbProvider() {
  return {
    getLatestDatabase: function getFakeDatabase() {
      return of({
        book: {
          findByIds: function findFakeBooks(ids: string[]) {
            return {
              exec: async function execFindFakeBooks() {
                return new Map(
                  ids.map((id) => [
                    id,
                    { incrementalPatch: mocks.incrementalPatch },
                  ]),
                )
              },
            }
          },
        },
      })
    },
  }
})

import { useMarkBooksAsFinished, useMarkBooksAsUnread } from "./useMarkBookAs"

function QueryWrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  )
}

async function markBook(useMarkBooksAs: typeof useMarkBooksAsFinished) {
  const { result } = renderHook(
    function renderUseMarkBooksAs() {
      return useMarkBooksAs()
    },
    { wrapper: QueryWrapper },
  )

  act(function markFakeBook() {
    result.current.mutate({ bookIds: ["book-1"] })
  })

  await waitFor(function expectBookPatched() {
    expect(mocks.incrementalPatch).toHaveBeenCalledTimes(1)
  })

  return mocks.incrementalPatch.mock.calls[0]?.[0]
}

describe("useMarkBooksAs", () => {
  beforeEach(() => {
    mocks.incrementalPatch.mockClear()
  })

  it("marks a book finished without a reading position, so it reopens at its start", async () => {
    expect(await markBook(useMarkBooksAsFinished)).toEqual({
      readingStateCurrentState: ReadingStateState.Finished,
      readingStateCurrentBookmarkLocation: null,
      readingStateCurrentBookmarkProgressPercent: 0,
      readingStateUpdatedAt: expect.any(String),
    })
  })

  it("marks a book unread without a reading position", async () => {
    expect(await markBook(useMarkBooksAsUnread)).toEqual({
      readingStateCurrentState: ReadingStateState.NotStarted,
      readingStateCurrentBookmarkLocation: null,
      readingStateCurrentBookmarkProgressPercent: 0,
      readingStateUpdatedAt: expect.any(String),
    })
  })
})
