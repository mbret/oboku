import type { BookDocType } from "@oboku/shared"
import type { DeepReadonly } from "rxdb"
import { Subject } from "rxjs"

const bookmarkMovedSubject = new Subject<DeepReadonly<BookDocType>>()

export const dispatchBookmarkMoved = (book: DeepReadonly<BookDocType>) =>
  bookmarkMovedSubject.next(book)

/**
 * Each book whose bookmark moved while read on this device, as the move saved
 * it. The last move is saved after the reader closes.
 */
export const bookmarkMoved$ = bookmarkMovedSubject.asObservable()
