import axios from "axios"
import { getBook } from "./getBook"
import { getBooks } from "./getBooks"

type Result = {
  title?: string
  desc?: string
}

export const getSeries = async (title: string) => {
  const books = await getBooks(title)

  const firstBook = books.data.result[0]

  if (!firstBook) return undefined

  const book = await getBook(firstBook.bookURL)

  const seriesUrl = book.data.seriesURL

  if (!seriesUrl) return undefined

  return axios<Result>({
    method: "post",
    url: "https://biblioreads.eu.org/api/series-scraper",
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      queryURL: seriesUrl,
    },
  })
}
