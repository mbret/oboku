import { createSignal } from "@react-rxjs/utils"

export const [markAsInterested$, markAsInterested] = createSignal<{
  id: string
  isNotInterested: boolean
}>()

export const [upsertBookLink$, upsertBookLink] = createSignal<{
  bookId: string
  linkResourceId: string
  linkType: string
}>()

export const [upsertBookLinkEnd$, upsertBookLinkEnd] = createSignal<string>()
