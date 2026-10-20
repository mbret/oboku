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
    case "googleBooks":
      return "Google Books"
    case "openLibrary":
      return "Open Library"
    case "projectGutenberg":
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
      return getCatalogProviderNameById("googleBooks")
    default:
      return undefined
  }
}
