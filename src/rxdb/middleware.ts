import { useDatabase } from './databases'

type Database = NonNullable<ReturnType<typeof useDatabase>>

export const applyHooks = (db: Database) => {
  db.book.postSave(async function (data) {
    const tagsFromWhichToRemoveBook = await db.tag.find({
      selector: {
        books: {
          $in: [data._id]
        },
        _id: {
          $nin: data.tags
        }
      }
    }).exec()

    // @todo bulk
    await Promise.all(tagsFromWhichToRemoveBook.map(async (tag) => {
      await tag.safeUpdate({
        $pullAll: {
          books: [data._id]
        }
      })
    }))

    const tagsFromWhichToAddBook = await db.tag.find({
      selector: {
        books: {
          $nin: [data._id]
        },
        _id: {
          $in: data.tags
        }
      }
    }).exec()

    // @todo bulk
    await Promise.all(tagsFromWhichToAddBook.map(async (tag) => {
      await tag.safeUpdate({
        $push: {
          books: data._id
        }
      })
    }))
  }, true)

  db.book.postRemove(async function (data) {
    /**
     * When a book is removed, dettach it from all tags
     * that contains its reference
     */
    await db.tag
      .safeUpdate({
        $pullAll: {
          books: [data._id]
        }
      }, collection => collection.find({
        selector: {
          books: {
            $in: [data._id]
          },
        }
      }))

      /**
       * Remove any link attached to that book
       */
    await db.link.safeFind({ selector: { book: data._id } }).remove()
  }, true)

  db.book.postInsert(async function (data) {
    /**
     * When a book is added, make sure to attach it to any links
     */
    await db.link
      .safeUpdate({
        $set: {
          book: data._id
        }
      }, collection => collection.safeFind({
        selector: {
          _id: {
            $in: data.links
          }
        }
      }))
  }, true)

  db.tag.postRemove(async function (data) {
    const booksFromWhichToRemoveTag = await db.book.find({
      selector: {
        tags: {
          $in: [data._id]
        },
      }
    }).exec()

    // @todo bulk
    await Promise.all(booksFromWhichToRemoveTag.map(async (book) => {
      await book.safeUpdate({
        $pullAll: {
          tags: [data._id]
        }
      })
    }))
  }, true)
}