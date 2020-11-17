import { useApolloClient } from "@apollo/client"
import { useCallback } from "react"
import { useAddBook } from "../books/queries"
import { useAddSeries } from "../series/queries"
import { useCreateTag } from "../tags/queries"

type LibraryJson = {
  books: { url: string }[],
  tags: { name: string }[],
  series: { name: string }[],
}

export const useLoadLibraryFromJson = () => {
  const client = useApolloClient()
  const addBook = useAddBook()
  const createTag = useCreateTag()
  const addSeries = useAddSeries()

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

    libraryJson.series.forEach(item => {
      console.log(item)
      addSeries(item.name)
    })
  }, [client])
}