import { ObservedValueOf, Subject } from "rxjs"

const markAsInterestedSubject = new Subject<{
  id: string
  isNotInterested: boolean
}>()

export const markAsInterested$ = markAsInterestedSubject.asObservable()

export const markAsInterested = (
  options: ObservedValueOf<typeof markAsInterestedSubject>
) => markAsInterestedSubject.next(options)

const upsertBookLinkSubject = new Subject<{
  bookId: string
  linkResourceId: string
  linkType: string
}>()

export const upsertBookLink$ = upsertBookLinkSubject.asObservable()

export const upsertBookLink = (
  options: ObservedValueOf<typeof upsertBookLinkSubject>
) => upsertBookLinkSubject.next(options)

const upsertBookLinkEndSubject = new Subject<string>()

export const upsertBookLinkEnd$ = upsertBookLinkEndSubject.asObservable()

export const upsertBookLinkEnd = (
  options: ObservedValueOf<typeof upsertBookLinkEndSubject>
) => upsertBookLinkEndSubject.next(options)
