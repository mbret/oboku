import { useApolloClient } from "@apollo/client"
import { useCallback } from "react"
import { useAddBook } from "../books/queries"
// import { useAddCollection } from "../collections/queries"
import { useCreateTag } from "../tags/queries"

type LibraryJson = {
  books: { url: string }[],
  tags: { name: string }[],
  collections: { name: string }[],
}

export const useLoadLibraryFromJson = () => {
  const client = useApolloClient()
  const addBook = useAddBook()
  const createTag = useCreateTag()
  // const addCollection = useAddCollection()

  return useCallback((json: string) => {
    const libraryJson = JSON.parse(json) as LibraryJson

    libraryJson.books.forEach(item => {
      console.log(item)
      // addBook(item.url)
    })

    libraryJson.tags.forEach(item => {
      console.log(item)
      createTag(item.name)
    })

    libraryJson.collections.forEach(item => {
      console.log(item)
      // addCollection(item.name)
    })
  }, [client])
}