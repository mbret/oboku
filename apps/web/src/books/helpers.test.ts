import { type BookDocType, createBookDefaults } from "@oboku/shared"
import {
  type Mutation,
  MutationCache,
  QueryClient,
  QueryClientProvider,
  type UseMutationResult,
  useMutation,
} from "@tanstack/react-query"
import { act, cleanup, renderHook, waitFor } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { of } from "rxjs"
import { afterEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(function createDatabaseWriteMocks() {
  return {
    updateBook: vi.fn(),
    incrementalUpdateBook: vi.fn(),
    incrementalUpdateCollection: vi.fn(),
  }
})

vi.mock(
  "../rxdb/RxDbProvider",
  async function mockRxDbProvider(importOriginal) {
    const database = {
      book: {
        findOne: function findFakeBook() {
          return {
            update: mocks.updateBook,
            exec: async function execFindFakeBook() {
              return { incrementalUpdate: mocks.incrementalUpdateBook }
            },
          }
        },
      },
      obokucollection: {
        findOne: function findFakeCollection() {
          return {
            exec: async function execFindFakeCollection() {
              return { incrementalUpdate: mocks.incrementalUpdateCollection }
            },
          }
        },
      },
    }

    return {
      ...(await importOriginal<typeof import("../rxdb/RxDbProvider")>()),
      getLatestDatabase: function getFakeDatabase() {
        return of(database)
      },
      useDatabase: function useFakeDatabase() {
        return { db: database }
      },
    }
  },
)

import {
  sortBooksBy,
  useAddCollectionToBook,
  useAddTagToBook,
  useRemoveCollectionFromBook,
  useRemoveTagFromBook,
} from "./helpers"

const createBook = (
  book: Pick<BookDocType, "_id"> & Partial<BookDocType>,
): BookDocType => ({
  ...createBookDefaults(),
  _rev: "1-book",
  rx_model: "book",
  rxdbMeta: { lwt: 1 },
  ...book,
})

describe("sortBooksBy", () => {
  it("puts the most recently added first and keeps books added together in their order", () => {
    const books = [
      createBook({ _id: "a", createdAt: 5 }),
      createBook({ _id: "b", createdAt: 5 }),
      createBook({ _id: "c", createdAt: 9 }),
      createBook({ _id: "d", createdAt: 5 }),
    ]

    expect(sortBooksBy(books, "date").map((book) => book._id)).toEqual([
      "c",
      "a",
      "b",
      "d",
    ])
  })

  it("orders by title, with numbers in natural order", () => {
    const books = [
      createBook({
        _id: "vol-10",
        metadata: [{ type: "link", title: "Vol. 10" }],
      }),
      createBook({
        _id: "vol-2",
        metadata: [{ type: "link", title: "Vol. 2" }],
      }),
      createBook({
        _id: "annex",
        metadata: [{ type: "link", title: "Annex" }],
      }),
    ]

    expect(sortBooksBy(books, "alpha").map((book) => book._id)).toEqual([
      "annex",
      "vol-2",
      "vol-10",
    ])
  })
})

const withoutGlobalErrorToast = { meta: { suppressGlobalErrorToast: true } }

function useSaveTagSelection() {
  const { mutateAsync: addTagToBook } = useAddTagToBook(withoutGlobalErrorToast)
  const { mutateAsync: removeTagFromBook } = useRemoveTagFromBook(
    withoutGlobalErrorToast,
  )

  return useMutation({
    mutationFn: function saveTagSelection() {
      return Promise.all([
        addTagToBook({ _id: "book-1", tagId: "tag-1" }),
        removeTagFromBook({ _id: "book-1", tagId: "tag-2" }),
      ])
    },
  })
}

function useSaveCollectionSelection() {
  const { mutateAsync: addCollectionToBook } = useAddCollectionToBook(
    withoutGlobalErrorToast,
  )
  const { mutateAsync: removeCollectionFromBook } = useRemoveCollectionFromBook(
    withoutGlobalErrorToast,
  )

  return useMutation({
    mutationFn: function saveCollectionSelection() {
      return Promise.all([
        addCollectionToBook({ _id: "book-1", collectionId: "collection-1" }),
        removeCollectionFromBook({
          _id: "book-1",
          collectionId: "collection-2",
        }),
      ])
    },
  })
}

function renderSelectionSave<TData>(
  useSave: () => UseMutationResult<TData, Error, void>,
) {
  const errorToast = vi.fn()
  const queryClient = new QueryClient({
    mutationCache: new MutationCache({
      onError: function showErrorToastUnlessSuppressed(
        error,
        _variables,
        _context,
        mutation,
      ) {
        if (!mutation.options.meta?.suppressGlobalErrorToast) {
          errorToast(error)
        }
      },
    }),
  })
  const { result } = renderHook(useSave, {
    wrapper: function SelectionSaveQueryClientProvider({
      children,
    }: {
      children: ReactNode
    }) {
      return createElement(
        QueryClientProvider,
        { client: queryClient },
        children,
      )
    },
  })

  return { save: result, queryClient, errorToast }
}

async function waitForEveryMutationToSettle(queryClient: QueryClient) {
  await waitFor(function expectNoPendingMutation() {
    expect(queryClient.isMutating()).toBe(0)
  })
}

function isBookWrite({ state: { variables } }: Mutation) {
  return (
    typeof variables === "object" &&
    variables !== null &&
    "doc" in variables &&
    variables.doc === "book-1"
  )
}

describe("a selection save", () => {
  afterEach(function unmountAndResetWrites() {
    cleanup()
    vi.resetAllMocks()
  })

  it("shows one error toast when the tag writes fail", async () => {
    const error = new Error("tag write failed")
    mocks.updateBook.mockRejectedValue(error)
    const { save, queryClient, errorToast } =
      renderSelectionSave(useSaveTagSelection)

    await act(async function saveTags() {
      await expect(save.current.mutateAsync()).rejects.toBe(error)
    })
    await waitForEveryMutationToSettle(queryClient)

    expect(errorToast).toHaveBeenCalledExactlyOnceWith(error)
  })

  it("shows one error toast when the book and collection writes fail", async () => {
    const error = new Error("write failed")
    mocks.incrementalUpdateBook.mockRejectedValue(error)
    mocks.incrementalUpdateCollection.mockRejectedValue(error)
    const { save, queryClient, errorToast } = renderSelectionSave(
      useSaveCollectionSelection,
    )

    await act(async function saveCollections() {
      await expect(save.current.mutateAsync()).rejects.toBe(error)
    })
    await waitForEveryMutationToSettle(queryClient)

    expect(errorToast).toHaveBeenCalledExactlyOnceWith(error)
  })

  it("waits for the collection write and shows one error toast when it fails after the book write", async () => {
    const error = new Error("collection write failed")
    const { promise: collectionWrite, reject: failCollectionWrite } =
      Promise.withResolvers<never>()
    mocks.incrementalUpdateBook.mockResolvedValue(null)
    mocks.incrementalUpdateCollection.mockReturnValue(collectionWrite)
    const onSaveSettled = vi.fn()
    const { save, queryClient, errorToast } = renderSelectionSave(
      useSaveCollectionSelection,
    )

    const saving = save.current.mutateAsync()
    saving.then(onSaveSettled, onSaveSettled)
    await waitFor(function expectBookWritesSucceeded() {
      expect(
        queryClient
          .getMutationCache()
          .findAll({ status: "success", predicate: isBookWrite }),
      ).toHaveLength(2)
    })

    expect(onSaveSettled).not.toHaveBeenCalled()

    await act(async function failTheCollectionWrites() {
      failCollectionWrite(error)
      await expect(saving).rejects.toBe(error)
    })
    await waitForEveryMutationToSettle(queryClient)

    expect(errorToast).toHaveBeenCalledExactlyOnceWith(error)
  })
})
