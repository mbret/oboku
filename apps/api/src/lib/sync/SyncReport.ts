import type {
  BookDocType,
  CollectionDocType,
  ReportEntry,
  SyncReportPostgresEntityShared,
  TagsDocType,
} from "@oboku/shared"

export class SyncReport {
  protected readonly report: {
    created_at: string
    ended_at: string
    report: ReportEntry[]
  } = {
    created_at: new Date().toISOString(),
    ended_at: new Date().toISOString(),
    report: [],
  }

  protected readonly references: Record<string, string> = {}

  protected state: SyncReportPostgresEntityShared["state"] = "success"

  constructor(
    protected datasourceId: string,
    protected userName: string,
  ) {}

  end() {
    this.report.ended_at = new Date().toISOString()
  }

  fail() {
    this.state = "error"
  }

  protected hasEntry(rx_model: ReportEntry["rx_model"], id: string) {
    return this.report.report.find(
      (entry) => entry.rx_model === rx_model && entry.id === id,
    )
  }

  protected getOrCreateEntry(
    rx_model: ReportEntry["rx_model"],
    { id, label }: { id: string; label?: string | null },
  ) {
    const found = this.report.report.find(
      (entry) => entry.rx_model === rx_model && entry.id === id,
    )

    if (!found) {
      const entry: ReportEntry = {
        id,
        rx_model,
        label: label || undefined,
      }

      this.report.report.push(entry)

      return entry
    }

    return found
  }

  protected getBookLabel(item: Partial<BookDocType>) {
    return item.metadata?.find(({ type }) => type === "link")?.title
  }

  protected getCollectionLabel(item: Partial<CollectionDocType>) {
    const title = item.metadata?.find(({ type }) => type === "link")?.title

    return typeof title === "string" ? title : title?.en
  }

  upsetReference(id: string | undefined, label: string) {
    if (!id) return this

    this.references[id] = label
  }

  addItem(
    rx_model: ReportEntry["rx_model"],
    { id, label }: { id: string; label?: string },
  ) {
    const item = this.getOrCreateEntry(rx_model, { id, label })

    if (!item.updated && !item.deleted) {
      item.added = true
    }
  }

  addBook(id: string) {
    this.addItem("book", { id })
  }

  updateBook(bookId: string) {
    const item = this.getOrCreateEntry("book", { id: bookId })

    if (!item.added && !item.deleted) {
      item.updated = true
    }
  }

  deleteBook(bookId: string) {
    const item = this.getOrCreateEntry("book", { id: bookId })

    if (!item.added && !item.updated) {
      item.deleted = true
    }
  }

  addLink(id: string) {
    this.addItem("link", { id })
  }

  updateLink(id: string) {
    const item = this.getOrCreateEntry("link", { id })

    if (!item.added && !item.deleted) {
      item.updated = true
    }
  }

  deleteLink(id: string) {
    const item = this.getOrCreateEntry("link", { id })

    if (!item.added && !item.updated) {
      item.deleted = true
    }
  }

  addTag(tag: Partial<TagsDocType> & { _id: string }) {
    this.addItem("tag", { id: tag._id, label: tag.name || undefined })
  }

  updateTag(id: string) {
    if (this.hasEntry("tag", id)) {
      return
    }

    this.report.report.push({
      id,
      rx_model: "tag",
      updated: true,
    })
  }

  addOrUpdateBookToTag({
    book,
    tag,
  }: {
    book: Partial<BookDocType> & { _id: string }
    tag: Partial<TagsDocType> & { _id: string }
  }) {
    const foundTag = this.getOrCreateEntry("tag", {
      id: tag._id,
      label: tag.name,
    })

    foundTag.linkedTo = foundTag.linkedTo ?? []

    if (!foundTag.linkedTo?.find(({ id }) => id === book._id)) {
      foundTag.linkedTo?.push({
        id: book._id,
        label: this.getBookLabel(book),
        rx_model: "book",
      })
      this.updateTag(tag._id)
    }
  }

  addOrUpdateTagsToBook({
    book,
    tags,
  }: {
    book: Partial<BookDocType> & { _id: string }
    tags: (Partial<TagsDocType> & { _id: string })[]
  }) {
    const item = this.getOrCreateEntry("book", {
      id: book._id,
      label: this.getBookLabel(book),
    })

    item.linkedTo = item.linkedTo ?? []

    tags.forEach((tag) => {
      if (!item.linkedTo?.find(({ id }) => id === tag._id)) {
        item.linkedTo?.push({
          id: tag._id,
          label: tag.name || undefined,
          rx_model: "tag",
        })
        this.updateBook(book._id)
      }
    })
  }

  deleteTag(id: string) {
    if (this.hasEntry("tag", id)) {
      return
    }

    this.report.report.push({
      id,
      rx_model: "tag",
      deleted: true,
    })
  }

  addCollection(item: Partial<CollectionDocType> & { _id: string }) {
    this.addItem("obokucollection", {
      id: item._id,
      label: this.getCollectionLabel(item),
    })
  }

  updateCollection(id: string) {
    if (this.hasEntry("obokucollection", id)) {
      return
    }

    this.report.report.push({
      id,
      rx_model: "obokucollection",
      updated: true,
    })
  }

  addCollectionsToBook({
    collections,
    book,
  }: {
    book: Partial<BookDocType> & { _id: string }
    collections: (Partial<CollectionDocType> & { _id: string })[]
  }) {
    const item = this.getOrCreateEntry("book", {
      id: book._id,
      label: this.getBookLabel(book),
    })

    item.linkedTo = item.linkedTo ?? []

    collections.forEach((collection) => {
      if (!item.linkedTo?.find(({ id }) => id === collection._id)) {
        item.linkedTo?.push({
          id: collection._id,
          label: this.getCollectionLabel(collection),
          rx_model: "obokucollection",
        })

        this.updateBook(book._id)
      }
    })
  }

  addBooksToCollection({
    collection,
    books,
  }: {
    books: (Partial<BookDocType> & { _id: string })[]
    collection: Partial<CollectionDocType> & { _id: string }
  }) {
    const item = this.getOrCreateEntry("obokucollection", {
      id: collection._id,
      label: this.getCollectionLabel(collection),
    })

    item.linkedTo = item.linkedTo ?? []

    books.forEach((book) => {
      if (!item.linkedTo?.find(({ id }) => id === book._id)) {
        item.linkedTo?.push({
          id: book._id,
          label: this.getBookLabel(book),
          rx_model: "book",
        })

        this.updateCollection(collection._id)
      }
    })
  }

  removeBooksFromCollection({
    collection,
    books,
  }: {
    books: (Partial<BookDocType> & { _id: string })[]
    collection: Partial<CollectionDocType> & { _id: string }
  }) {
    const item = this.getOrCreateEntry("obokucollection", {
      id: collection._id,
      label: this.getCollectionLabel(collection),
    })

    item.unlinkedTo = item.unlinkedTo ?? []

    books.forEach((book) => {
      if (!item.unlinkedTo?.find(({ id }) => id === book._id)) {
        item.unlinkedTo?.push({
          id: book._id,
          label: this.getBookLabel(book),
          rx_model: "book",
        })

        this.updateCollection(collection._id)
      }
    })
  }

  fetchBookMetadata(bookId: string) {
    const item = this.getOrCreateEntry("book", { id: bookId })

    item.fetchedMetadata = true
  }

  prepare() {
    return {
      created_at: this.report.created_at,
      ended_at: this.report.ended_at,
      report: this.report.report.map((entry) => ({
        ...entry,
        label: entry.label ?? this.references[entry.id] ?? entry.id,
      })),
      datasource_id: this.datasourceId,
      user_name: this.userName,
      state: this.state,
    }
  }
}
