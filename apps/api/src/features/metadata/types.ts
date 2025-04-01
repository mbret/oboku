import type { BookDocType, LinkDocType } from "@oboku/shared"

export type Context = {
  userName: string
  userNameHex: string
  credentials?: any
  book: BookDocType
  link: LinkDocType
}
