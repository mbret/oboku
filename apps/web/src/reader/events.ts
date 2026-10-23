import { Subject } from "rxjs"

type BookmarkMove = { bookId: string; movedAt: string }

const bookmarkMovedSubject = new Subject<BookmarkMove>()

export const dispatchBookmarkMoved = (move: BookmarkMove) =>
  bookmarkMovedSubject.next(move)

/**
 * Each move of a book's bookmark made by reading on this device, dated as its
 * save dated the bookmark. The last move is saved after the reader closes.
 */
export const bookmarkMoved$ = bookmarkMovedSubject.asObservable()
