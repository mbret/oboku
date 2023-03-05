import { createSignal } from "@react-rxjs/utils"

export const [markAsNotInterested$, markAsNotInterested] =
  createSignal<string>()

export const [upsertBookLink$, upsertBookLink] = createSignal<{
  bookId: string
  linkResourceId: string
  linkType: string
}>()

export const [upsertBookLinkEnd$, upsertBookLinkEnd] = createSignal<string>()
