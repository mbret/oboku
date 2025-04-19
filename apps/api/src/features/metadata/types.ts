import type { BookDocType, LinkDocType } from "@oboku/shared"

export type Context = {
  userName: string
  userNameHex: string
  data?: Record<string, unknown>
  book: BookDocType
  link: LinkDocType
}
