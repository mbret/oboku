/**
 * Universal labels for {@link BookMetadata} fields. Shared across provider
 * content components since "Title" / "Authors" / etc. mean the same thing
 * regardless of which provider produced the value.
 */
export const BOOK_METADATA_FIELD_LABELS = {
  title: "Title",
  authors: "Authors",
  description: "Description",
  rating: "Rating",
  coverLink: "Cover address",
  coverConfidence: "Cover origin",
  pageCount: "Page count",
  contentType: "Content type",
  date: "Date",
  size: "Size",
  languages: "Languages",
  subjects: "Subjects",
  publisher: "Publisher",
  rights: "Rights",
  modifiedAt: "Modified at",
} as const
