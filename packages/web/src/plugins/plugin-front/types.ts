import { BookDocType, LinkDocType } from "@oboku/shared"

export type PostBook = Pick<BookDocType, "title">

export type PostLink = Pick<LinkDocType, "resourceId" | "type">
