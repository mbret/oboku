/**
 * Universal labels for {@link BookMetadata} fields. Shared across source
 * content components since "Title" / "Authors" / etc. mean the same thing
 * regardless of which provider produced the value.
 */
export const BOOK_METADATA_FIELD_LABELS = {
  title: "Title",
  authors: "Authors",
  description: "Description",
  formatType: "Format types",
  rating: "Rating",
  coverLink: "Cover link",
  pageCount: "Page count",
  contentType: "Content type",
  date: "Date",
  size: "Size",
  languages: "Languages",
  subjects: "Subjects",
  isbn: "ISBN",
  publisher: "Publisher",
  rights: "Rights",
} as const
