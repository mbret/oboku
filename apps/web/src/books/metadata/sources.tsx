import {
  Google,
  InsertLinkOutlined,
  PersonOutlineOutlined,
  PlagiarismOutlined,
} from "@mui/icons-material"
import type { BookMetadataSource } from "@oboku/shared"
import type { ReactNode } from "react"

export {
  type BookMetadataSource,
  BOOK_METADATA_SOURCES,
  getOrderedBookMetadataSources,
  isBookMetadataSource,
} from "@oboku/shared"

export const getBookMetadataSourceLabel = (
  source: BookMetadataSource,
): string => {
  switch (source) {
    case "file":
      return "File"
    case "googleBookApi":
      return "Google Book API"
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
    case "googleBookApi":
      return <Google />
    case "user":
      return <PersonOutlineOutlined />
    case "link":
      return <InsertLinkOutlined />
  }
}
