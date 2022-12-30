import { Logger } from "@libs/logger"
import { getParameterValue } from "@libs/ssm"
import axios from "axios"
import { GOOGLE_BOOK_API_URL } from "../../constants"

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
    imageLinks: { thumbnail: string },
    seriesInfo?: {
      bookDisplayNumber?: string // number as string
    }
  }
}

export type GoogleBooksApiResult = {
  kind: `books#volumes` | `unknown`,
  totalItems: number,
  items?: Item[] // does not exist when totalItems is 0
}

/**
 * Supports formats like: [9782413023470, 978-1-947804-36-4]
 */
export const findByISBN = async (isbn: string) => {
  const apiKey = await getParameterValue({ Name: `GOOGLE_API_KEY`, WithDecryption: true })
  const response = await axios.get<GoogleBooksApiResult>(`${GOOGLE_BOOK_API_URL}/volumes?q=isbn:${isbn}&key=${apiKey}`)

  if (response.status === 200) {
    Logger.log(`google findByISBN response`, response.data)

    return response.data
  }

  throw new Error(`An error occured during findByISBN`)
}