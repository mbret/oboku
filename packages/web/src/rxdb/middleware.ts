import { UpdateQuery } from "rxdb"
import { type useDatabase } from "./index"
import {
  BookDocType,
  CollectionDocType,
  LinkDocType,
  TagsDocType
} from "@oboku/shared"

type Database = NonNullable<ReturnType<typeof useDatabase>["db"]>

const EXEC_PARALLEL = true

export const applyHooks = (db: Database) => {
  db.book.postSave(async function (data, d) {
    const tagsFromWhichToRemoveBook = await db.tag
      .find({
        selector: {
          books: {
            $in: [data._id]
          },
          _id: {
            $nin: data.tags
          }
        }
      })
      .exec()

    // Remove the book from all collections that are not anymore in this book
    // but that also still reference the book
    await db.obokucollection
      .find({
        selector: {
          books: {
            $in: [data._id]
          },
          _id: {
            $nin: data.collections
          }
        }
      })
      .update({
        $pullAll: {
          books: [data._id]
        }
      } satisfies UpdateQuery<CollectionDocType>)

    // add the book to any collections that are in this book
    // but does not reference it yet
    await db.obokucollection
      .find({
        selector: {
          // if at least one of the books is data._id it will work.
          // be careful with $nin
          books: {
            $nin: [data._id]
          },
          _id: {
            $in: data.collections
          }
        }
      })
      .update({
        $push: {
          books: data._id
        }
      } satisfies UpdateQuery<CollectionDocType>)

    // @todo bulk
    await Promise.all(
      tagsFromWhichToRemoveBook.map(async (tag) => {
        await tag.update({
          $pullAll: {
            books: [data._id]
          }
        })
      })
    )

    // Update all the tags that are referenced by this book but are
    // not yet linked
    const tagsFromWhichToAddBook = await db.tag
      .find({
        selector: {
          books: {
            // if at least one of the books is data._id it will work.
            // be careful with $nin
            $nin: [data._id]
          },
          _id: {
            $in: data.tags
          }
        }
      })
      .exec()

    // @todo bulk
    await Promise.all(
      tagsFromWhichToAddBook.map(async (tag) => {
        await tag.update({
          $push: {
            books: data._id
          }
        })
      })
    )
  }, true)

  db.book.postRemove(async function (data) {
    /**
     * When a book is removed, dettach it from all tags
     * that contains its reference
     */
    await db.tag
      .find({
        selector: {
          books: {
            $in: [data._id]
          }
        }
      })
      .update({
        $pullAll: {
          books: [data._id]
        }
      } satisfies UpdateQuery<TagsDocType>)

    // dettach all collections to this book
    await db.obokucollection
      .find({
        selector: {
          books: {
            $in: [data._id]
          }
        }
      })
      .update({
        $pullAll: {
          books: [data._id]
        }
      } satisfies UpdateQuery<CollectionDocType>)

    /**
     * Remove any link attached to that book
     */
    await db.link.find({ selector: { book: data._id } }).remove()
  }, true)

  db.book.postInsert(async function (data) {
    /**
     * When a book is added, make sure to attach it to any links
     */
    await db.link
      .find({
        selector: {
          _id: {
            $in: data.links
          }
        }
      })
      .update({
        $set: {
          book: data._id
        }
      } satisfies UpdateQuery<LinkDocType>)
  }, true)

  db.tag.postRemove(async function (data) {
    const booksFromWhichToRemoveTag = await db.book
      .find({
        selector: {
          tags: {
            $in: [data._id]
          }
        }
      })
      .exec()

    // @todo bulk
    await Promise.all(
      booksFromWhichToRemoveTag.map(async (book) => {
        await book.update({
          $pullAll: {
            tags: [data._id]
          }
        })
      })
    )
  }, true)

  db.obokucollection.postRemove(async function (data) {
    // remove any book that were attached to this collection
    await db.book
      .find({
        selector: {
          collections: {
            $in: [data._id]
          }
        }
      })
      .update({
        $pullAll: {
          collections: [data._id]
        }
      } satisfies UpdateQuery<BookDocType>)
  }, true)

  updateRelationBetweenLinksAndBooksHook(db)
}

const updateRelationBetweenLinksAndBooksHook = (db: Database) => {
  db.link.postInsert(async (data) => {
    // @todo there is a bug, it triggers twice the insert event
    const bookId = data.book
    // when a link is added update the book with its id
    if (bookId) {
      await db.book
        .find({
          selector: {
            _id: {
              $in: [bookId]
            }
          }
        })
        .update({
          $set: {
            links: [data._id]
          }
        } satisfies UpdateQuery<BookDocType>)
    }
  }, EXEC_PARALLEL)
}
