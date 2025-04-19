import { z } from "zod"

export const PLUGIN_FILE_TYPE = "file"

export const fileLinkDataSchema = z.object({
  filename: z.string().optional(),
})

// Extract TypeScript types from Zod schemas
export type FileLinkData = z.infer<typeof fileLinkDataSchema>

export const getFileLinkData = (data: Record<string, unknown>) => {
  return fileLinkDataSchema.parse(data)
}
