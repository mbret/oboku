import { createBookDefaults } from "@oboku/shared"
import { firstValueFrom } from "rxjs"
import { describe, expect, it, onTestFinished } from "vitest"
import { createDatabase, type Database } from "../databases.shared"
import type { RxdbAnnotationDocType } from "./annotation"

const openDatabase = async () => {
  const database = await firstValueFrom(
    createDatabase({ name: `annotation-${crypto.randomUUID()}` }),
  )

  onTestFinished(async function removeDatabase() {
    await database.remove()
  })

  return database
}

const insertBook = (database: Database) =>
  database.book.post(createBookDefaults())

const insertAnnotation = (database: Database, bookId: string) =>
  database.annotation.insert({
    _id: crypto.randomUUID(),
    rx_model: "annotation",
    bookId,
    cfi: "epubcfi(/6/4!/4/2/1:0)",
    createdAt: new Date().toISOString(),
    modifiedAt: null,
  })

const insertBookWithTwoAnnotations = async (database: Database) => {
  const book = await insertBook(database)
  await insertAnnotation(database, book._id)
  await insertAnnotation(database, book._id)

  return book
}

const findAnnotationBookIds = async (database: Database) => {
  const annotations = await database.annotation.find().exec()

  return annotations.map((annotation) => annotation.bookId)
}

describe("annotation collection", () => {
  it("stores an annotation and finds the annotations of one book", async () => {
    const database = await openDatabase()
    const highlight: RxdbAnnotationDocType = {
      _id: crypto.randomUUID(),
      rx_model: "annotation",
      bookId: "book-1",
      cfi: "epubcfi(/6/4!/4/2,/1:0,/1:12)",
      highlightColor: "rgba(216, 191, 216, 1)",
      notes: "",
      text: "Call me Ishmael",
      koreaderDocument: "0123456789abcdef0123456789abcdef",
      createdAt: "2026-11-19T10:00:00.000Z",
      modifiedAt: null,
    }
    await database.annotation.insert(highlight)
    await insertAnnotation(database, "book-2")

    const annotationsOfFirstBook = await database.annotation
      .find({ selector: { bookId: "book-1" } })
      .exec()

    expect(
      annotationsOfFirstBook.map((annotation) => annotation.toJSON()),
    ).toMatchObject([highlight])
  })

  it("removes the annotations of a removed book only", async () => {
    const database = await openDatabase()
    const removedBook = await insertBookWithTwoAnnotations(database)
    const keptBook = await insertBookWithTwoAnnotations(database)

    await removedBook.incrementalRemove()

    expect(await findAnnotationBookIds(database)).toEqual([
      keptBook._id,
      keptBook._id,
    ])
  })

  it("removes the annotations of books removed through a query", async () => {
    const database = await openDatabase()
    await insertBookWithTwoAnnotations(database)
    await insertBookWithTwoAnnotations(database)

    await database.book.find().incrementalRemove()

    expect(await findAnnotationBookIds(database)).toEqual([])
  })
})
