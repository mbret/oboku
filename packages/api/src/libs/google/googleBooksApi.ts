import axios, { isAxiosError } from "axios"
import { GOOGLE_BOOK_API_URL } from "../../constants"
import { Item } from "./types"
import { performWithBackoff } from "@libs/utils"

export type GoogleBooksApiResult = {
  kind: `books#volumes` | `unknown`
  totalItems: number
  items?: Item[] // does not exist when totalItems is 0
}

/**
 * Supports formats like: [9782413023470, 978-1-947804-36-4]
 */
export const findByISBN = async (isbn: string, apiKey: string) => {
  const response = await performWithBackoff({
    asyncFunction: () =>
      axios.get<GoogleBooksApiResult>(
        `${GOOGLE_BOOK_API_URL}/volumes?q=isbn:${isbn}&key=${apiKey}`
      ),
    retry: (error: unknown) => {
      // we retry on Too many request error
      return isAxiosError(error) && error.response?.status === 429
    }
  })

  if (response.status === 200) {
    // Logger.info(`google findByISBN response`, response.data)

    return response.data
  }

  throw new Error(`An error occurred during findByISBN`)
}

export const findByTitle = async (name: string, apiKey: string) => {
  const response = await performWithBackoff({
    asyncFunction: () =>
      axios.get<GoogleBooksApiResult>(
        `${GOOGLE_BOOK_API_URL}/volumes?q=intitle:${name}&key=${apiKey}`
      ),
    retry: (error: unknown) => {
      // we retry on Too many request error
      return isAxiosError(error) && error.response?.status === 429
    }
  })

  if (response.status === 200) {
    // Logger.info(`google findByName response`, response.data)

    return response.data
  }

  throw new Error(`An error occurred during findByISBN`)
}

export const findSeriesByTitle = async (name: string, apiKey: string) => {
  const response = await performWithBackoff({
    asyncFunction: () =>
      axios.get<GoogleBooksApiResult>(
        `${GOOGLE_BOOK_API_URL}/volumes?q=intitle:${name}&key=${apiKey}`
      ),
    retry: (error: unknown) => {
      // we retry on Too many request error
      return isAxiosError(error) && error.response?.status === 429
    }
  })

  if (response.status === 200) {
    // Logger.info(`google findByName response`, response.data)

    return response.data
  }

  throw new Error(`An error occurred during findByISBN`)
}