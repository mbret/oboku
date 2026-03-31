import { z } from "zod"
import type { BaseDataSourceDocType } from "../../db/docTypes"

export const PLUGIN_FILE_TYPE = "file"

export type FileDataSourceDocType = BaseDataSourceDocType & {
  type: "file"
  data_v2?: undefined
}

export const fileLinkDataSchema = z.object({
  filename: z.string().optional(),
})

// Extract TypeScript types from Zod schemas
export type FileLinkData = z.infer<typeof fileLinkDataSchema>

export const getFileLinkData = (data: Record<string, unknown>) => {
  return fileLinkDataSchema.parse(data)
}
