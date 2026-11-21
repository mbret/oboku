import { createBookDefaults } from "@oboku/shared"
import { createRxDatabase } from "rxdb"
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie"
import { wrappedValidateAjvStorage } from "rxdb/plugins/validate-ajv"
import { describe, expect, it } from "vitest"
import { openTestDatabase } from "../databases.fixture"
import type { Database } from "../databases.shared"
import type { RxdbAnnotationDocType } from "./annotation"

const storeBookmarkOfSchemaVersionZero = async (
  name: string,
  bookmark: Record<string, unknown>,
) => {
  const database = await createRxDatabase({
    name,
    storage: wrappedValidateAjvStorage({ storage: getRxStorageDexie() }),
  })
  const { annotation } = await database.addCollections({
    annotation: {
      schema: {
        title: "annotation",
        version: 0,
        type: "object",
        primaryKey: "_id",
        properties: {
          _id: { type: "string", maxLength: 100 },
          bookId: { type: "string", maxLength: 100 },
          cfi: { type: "string" },
          highlightColor: { type: ["string", "null"] },
          notes: { type: ["string", "null"] },
          text: { type: ["string", "null"] },
          createdAt: { type: "string" },
          modifiedAt: { type: ["string", "null"] },
          rx_model: {
            type: "string",
            enum: ["annotation"],
            default: "annotation",
            final: true,
          },
          rxdbMeta: { type: "object" },
        },
        required: ["bookId", "cfi", "createdAt"],
        indexes: ["bookId"],
      },
    },
  })

  await annotation.insert(bookmark)
  await database.close()
}

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
  const book = await database.book.post(createBookDefaults())
  await insertAnnotation(database, book._id)
  await insertAnnotation(database, book._id)

  return book
}

const findAnnotationBookIds = async (database: Database) => {
  const annotations = await database.annotation.find().exec()

  return annotations.map((annotation) => annotation.bookId)
}

describe("annotation collection", () => {
  it("keeps the annotations stored with the schema before highlightedText", async () => {
    const name = `annotation-${crypto.randomUUID()}`
    const bookmark = {
      _id: crypto.randomUUID(),
      rx_model: "annotation",
      bookId: "book-1",
      cfi: "epubcfi(/6/4!/4/2/1:0)",
      createdAt: "2026-11-19T10:00:00.000Z",
      modifiedAt: null,
    }
    await storeBookmarkOfSchemaVersionZero(name, bookmark)

    const database = await openTestDatabase(name)
    const annotations = await database.annotation.find().exec()

    expect(annotations.map((annotation) => annotation.toJSON())).toStrictEqual([
      bookmark,
    ])
  })

  it("stores an annotation and finds the annotations of one book", async () => {
    const database = await openTestDatabase()
    const highlight: RxdbAnnotationDocType = {
      _id: crypto.randomUUID(),
      rx_model: "annotation",
      bookId: "book-1",
      cfi: "epubcfi(/6/4!/4/2,/1:0,/1:12)",
      highlightColor: "rgba(216, 191, 216, 1)",
      notes: "",
      highlightedText: "Call me Ishmael",
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
    const database = await openTestDatabase()
    const removedBook = await insertBookWithTwoAnnotations(database)
    const keptBook = await insertBookWithTwoAnnotations(database)

    await removedBook.incrementalRemove()

    expect(await findAnnotationBookIds(database)).toEqual([
      keptBook._id,
      keptBook._id,
    ])
  })

  it("removes the annotations of books removed through a query", async () => {
    const database = await openTestDatabase()
    await insertBookWithTwoAnnotations(database)
    await insertBookWithTwoAnnotations(database)

    await database.book.find().incrementalRemove()

    expect(await findAnnotationBookIds(database)).toEqual([])
  })
})
