export type MetadataIdentifierFormValue = {
  scheme: string
  value: string
  /**
   * Set for the identifier the book's OPF points at as its unique identifier.
   * That element is structural, so the row stays in the list — it can be
   * edited but not removed.
   */
  unique: boolean
}

/** The metadata slice of the optimize form. */
export type MetadataFixerFormValues = {
  identifiers: MetadataIdentifierFormValue[]
}
