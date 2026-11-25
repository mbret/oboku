import {
  InsertLinkOutlined,
  PersonOutlineOutlined,
  PlagiarismOutlined,
  TravelExploreOutlined,
} from "@mui/icons-material"
import {
  type BookMetadata,
  type BookMetadataProvider,
  LEGACY_CATALOG_SOURCE_NAME,
} from "@oboku/shared"
import {
  GOOGLE_BOOKS_PROVIDER_ID,
  OPEN_LIBRARY_PROVIDER_ID,
  PROJECT_GUTENBERG_PROVIDER_ID,
} from "@prose-reader/metadata-fetcher"
import type { ReactNode } from "react"
import type { DeepReadonlyObject } from "rxdb"

export {
  type BookMetadataProvider,
  getOrderedBookMetadataProviders,
  isBookMetadataProvider,
} from "@oboku/shared"

export const getBookMetadataProviderLabel = (
  provider: BookMetadataProvider,
): string => {
  switch (provider) {
    case "file":
      return "File"
    case "catalog":
      return "Catalog"
    case "user":
      return "User"
    case "link":
      return "Source"
  }
}

export const getBookMetadataProviderIcon = (
  provider: BookMetadataProvider,
): ReactNode => {
  switch (provider) {
    case "file":
      return <PlagiarismOutlined />
    case "catalog":
      return <TravelExploreOutlined />
    case "user":
      return <PersonOutlineOutlined />
    case "link":
      return <InsertLinkOutlined />
  }
}

/** The catalogs a metadata refresh can ask, in the order the app lists them. */
export const CATALOG_PROVIDER_IDS = [
  GOOGLE_BOOKS_PROVIDER_ID,
  OPEN_LIBRARY_PROVIDER_ID,
  PROJECT_GUTENBERG_PROVIDER_ID,
]

export const getCatalogProviderNameById = (providerId: string): string => {
  switch (providerId) {
    case GOOGLE_BOOKS_PROVIDER_ID:
      return "Google Books"
    case OPEN_LIBRARY_PROVIDER_ID:
      return "Open Library"
    case PROJECT_GUTENBERG_PROVIDER_ID:
      return "Project Gutenberg"
    default:
      return providerId
  }
}

/** The catalog an entry was matched in, or `undefined` for other providers. */
export const getCatalogProviderName = (
  entry: DeepReadonlyObject<BookMetadata>,
): string | undefined => {
  switch (entry.type) {
    case "catalog":
      return getCatalogProviderNameById(entry.providerId)
    case LEGACY_CATALOG_SOURCE_NAME:
      return getCatalogProviderNameById(GOOGLE_BOOKS_PROVIDER_ID)
    default:
      return undefined
  }
}
