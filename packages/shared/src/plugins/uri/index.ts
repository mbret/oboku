import { z } from "zod"
import type { BaseDataSourceDocType } from "../../db/docTypes"

export type URIDataSourceDocType = BaseDataSourceDocType & {
  type: "URI"
  data_v2?: UriLinkData
}

export const uriLinkDataSchema = z.object({
  url: z.string(),
  allowSelfSigned: z.boolean().optional(),
})

export type UriLinkData = z.infer<typeof uriLinkDataSchema>

export function isUriLinkData(data: unknown): data is UriLinkData {
  return uriLinkDataSchema.safeParse(data).success
}

export const getUriLinkData = (data: Record<string, unknown>) => {
  return uriLinkDataSchema.parse(data)
}
