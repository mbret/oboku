import { trigger } from "reactjrx"

export const [markAsInterested$, markAsInterested] = trigger<{
  id: string
  isNotInterested: boolean
}>()

export const [upsertBookLink$, upsertBookLink] = trigger<{
  bookId: string
  linkResourceId: string
  linkType: string
}>()

export const [upsertBookLinkEnd$, upsertBookLinkEnd] = trigger<string>()
