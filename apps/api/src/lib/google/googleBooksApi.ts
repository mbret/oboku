import axios, { isAxiosError } from "axios"
import type { Item } from "./types"
import { performWithBackoff } from "../utils"
import { EnvironmentVariables } from "src/types"
import { ConfigService } from "@nestjs/config"

export type GoogleBooksApiVolumesResponseData = {
  kind: `books#volumes` | `unknown`
  totalItems: number
  items?: Item[] // does not exist when totalItems is 0
}

export type GoogleBooksApiVolumeResponseData = Item

/**
 * Supports formats like: [9782413023470, 978-1-947804-36-4]
 */
export const findByISBN = async (
  isbn: string,
  apiKey: string,
  config: ConfigService<EnvironmentVariables>,
) => {
  const url = `${config.getOrThrow("GOOGLE_BOOK_API_URL", { infer: true })}/volumes?q=isbn:${encodeURIComponent(isbn)}&key=${apiKey}`

  console.log("[google] [findByISBN]", { url })

  const response = await performWithBackoff({
    asyncFunction: () => axios.get<GoogleBooksApiVolumesResponseData>(url),
    retry: (error: unknown) => {
      // we retry on Too many request error
      return isAxiosError(error) && error.response?.status === 429
    },
  })

  if (response.status === 200) {
    // Logger.info(`google findByISBN response`, response.data)

    return response.data
  }

  throw new Error(`An error occurred during findByISBN`)
}

export const findByTitle = async (
  name: string,
  apiKey: string,
  config: ConfigService<EnvironmentVariables>,
) => {
  const uri = `${config.getOrThrow("GOOGLE_BOOK_API_URL", { infer: true })}/volumes?q=intitle:${encodeURIComponent(name)}&key=${apiKey}`

  console.log("[google] [findByTitle]", { uri })

  const response = await performWithBackoff({
    asyncFunction: () => axios.get<GoogleBooksApiVolumesResponseData>(uri),
    retry: (error: unknown) => {
      // we retry on Too many request error
      return isAxiosError(error) && error.response?.status === 429
    },
  })

  if (response.status === 200) {
    // Logger.info(`google findByName response`, response.data)

    return response.data
  }

  throw new Error(`An error occurred during findByISBN`)
}

export const findByVolumeId = async (
  name: string,
  apiKey: string,
  config: ConfigService<EnvironmentVariables>,
) => {
  const uri = `${config.getOrThrow("GOOGLE_BOOK_API_URL", { infer: true })}/volumes/${encodeURIComponent(name)}?key=${apiKey}`

  console.log("[google] [findByVolumeId]", { uri })

  const response = await performWithBackoff({
    asyncFunction: () => axios.get<GoogleBooksApiVolumeResponseData>(uri),
    retry: (error: unknown) => {
      // we retry on Too many request error
      return isAxiosError(error) && error.response?.status === 429
    },
  })

  if (response.status === 200) {
    return {
      items: [response.data],
    }
  }

  throw new Error(`An error occurred during findByISBN`)
}

export const findSeriesByTitle = async (
  name: string,
  apiKey: string,
  config: ConfigService<EnvironmentVariables>,
) => {
  const response = await performWithBackoff({
    asyncFunction: () =>
      axios.get<GoogleBooksApiVolumesResponseData>(
        `${config.getOrThrow("GOOGLE_BOOK_API_URL", { infer: true })}/volumes?q=intitle:${name}&key=${apiKey}`,
      ),
    retry: (error: unknown) => {
      // we retry on Too many request error
      return isAxiosError(error) && error.response?.status === 429
    },
  })

  if (response.status === 200) {
    // Logger.info(`google findByName response`, response.data)

    return response.data
  }

  throw new Error(`An error occurred during findByISBN`)
}
