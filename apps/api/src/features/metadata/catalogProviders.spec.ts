import {
  GOOGLE_BOOKS_PROVIDER_ID,
  OPEN_LIBRARY_PROVIDER_ID,
  PROJECT_GUTENBERG_PROVIDER_ID,
} from "@prose-reader/metadata-fetcher"
import { describe, expect, it } from "vitest"
import { createCatalogProviders } from "./catalogProviders.js"

const providerIds = (googleApiKey: string | undefined) =>
  createCatalogProviders({
    googleApiKey,
    googleBooksBaseUrl: "https://www.googleapis.com/books/v1",
  }).map((provider) => provider.id)

describe("createCatalogProviders", () => {
  it("asks Google Books when the instance has an API key", () => {
    expect(providerIds("api-key")).toEqual([
      PROJECT_GUTENBERG_PROVIDER_ID,
      GOOGLE_BOOKS_PROVIDER_ID,
      OPEN_LIBRARY_PROVIDER_ID,
    ])
  })

  it("leaves Google Books out without an API key", () => {
    expect(providerIds(undefined)).toEqual([
      PROJECT_GUTENBERG_PROVIDER_ID,
      OPEN_LIBRARY_PROVIDER_ID,
    ])
    expect(providerIds("  ")).toEqual([
      PROJECT_GUTENBERG_PROVIDER_ID,
      OPEN_LIBRARY_PROVIDER_ID,
    ])
  })
})
