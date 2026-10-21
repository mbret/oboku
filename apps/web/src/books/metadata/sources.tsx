import {
  InsertLinkOutlined,
  PersonOutlineOutlined,
  PlagiarismOutlined,
  TravelExploreOutlined,
} from "@mui/icons-material"
import {
  type BookMetadata,
  type BookMetadataSource,
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
  type BookMetadataSource,
  getOrderedBookMetadataSources,
  isBookMetadataSource,
} from "@oboku/shared"

export const getBookMetadataSourceLabel = (
  source: BookMetadataSource,
): string => {
  switch (source) {
    case "file":
      return "File"
    case "catalog":
      return "Catalog"
    case "user":
      return "User"
    case "link":
      return "Link"
  }
}

export const getBookMetadataSourceIcon = (
  source: BookMetadataSource,
): ReactNode => {
  switch (source) {
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

const getCatalogProviderNameById = (providerId: string): string => {
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

/** The catalog an entry was matched in, or `undefined` for other sources. */
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
