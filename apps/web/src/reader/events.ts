import type { BookDocType } from "@oboku/shared"
import { Subject } from "rxjs"

const bookmarkMovedSubject = new Subject<BookDocType>()

export const dispatchBookmarkMoved = (book: BookDocType) =>
  bookmarkMovedSubject.next(book)

/**
 * Each book whose bookmark moved while read on this device, once the move is
 * saved. The last move is saved after the reader closes.
 */
export const bookmarkMoved$ = bookmarkMovedSubject.asObservable()
