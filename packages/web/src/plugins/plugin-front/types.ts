import { LinkDocType } from "@oboku/shared"

export type PostBook = {}

export type PostLink = Pick<LinkDocType, "resourceId" | "type">
