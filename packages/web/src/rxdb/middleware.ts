import { useDatabase } from './RxDbProvider'

type Database = NonNullable<ReturnType<typeof useDatabase>>

const EXEC_PARALLEL = true

export const applyHooks = (db: Database) => {
  db.book.postSave(async function (data, d) {
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

    // Remove the book from all collections that are not anymore in this book
    // but that also still reference the book
    await db.obokucollection
      .safeUpdate({
        $pullAll: {
          books: [data._id]
        }
      }, collection => collection.safeFind({
        selector: {
          books: {
            $in: [data._id]
          },
          _id: {
            $nin: data.collections
          },
        }
      }))

    // add the book to any collections that are in this book
    // but does not reference it yet
    await db.obokucollection
      .safeUpdate({
        $push: {
          books: data._id
        }
      }, collection => collection.safeFind({
        selector: {
          books: {
            $nin: [data._id]
          },
          _id: {
            $in: data.collections
          },
        }
      }))

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

    // dettach all collections to this book
    await db.obokucollection
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

  db.obokucollection.postRemove(async function (data) {
    // remove any book that were attached to this collection
    await db.book.safeUpdate({
      $pullAll: {
        collections: [data._id]
      }
    }, collection => collection.find({
      selector: {
        collections: {
          $in: [data._id]
        },
      }
    }))
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
        .safeUpdate({
          $set: {
            links: [data._id]
          }
        }, collection => collection.safeFind({
          selector: {
            _id: {
              $in: [bookId]
            }
          }
        }))
    }
  }, EXEC_PARALLEL)
}