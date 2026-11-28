import { z } from "zod"
import type { BaseLibrarySyncDocType } from "../../db/docTypes"

export type URILibrarySyncDocType = BaseLibrarySyncDocType & {
  type: "URI"
  data_v2?: UriLinkData
}

export const uriLinkDataSchema = z.object({
  url: z.string(),
  allowSelfSigned: z.boolean().optional(),
  /** oboku's server downloads the book, for a server that refuses the browser (CORS). */
  proxyThroughServer: z.boolean().optional(),
})

export type UriLinkData = z.infer<typeof uriLinkDataSchema>
