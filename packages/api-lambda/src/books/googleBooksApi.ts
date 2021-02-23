import axios from "axios"
import { GOOGLE_BOOK_API_URL, GOOGLE_API_KEY } from "../constants"

type YEAR = string

type Item = {
  kind: string,
  id: string,
  etag: string,
  selfLink: string,
  volumeInfo: {
    title: string,
    authors: string[],
    publisher: string,
    publishedDate: YEAR,
    language: string
    categories: string[],
    imageLinks: { thumbnail: string}
  }
}

type Response = {
  kind: string,
  totalItems: number,
  items?: Item[]
}

export const findByISBN = (isbn: string) =>
  axios.get<Response>(`${GOOGLE_BOOK_API_URL}/volumes?q=isbn:${isbn}&key=${GOOGLE_API_KEY}`)