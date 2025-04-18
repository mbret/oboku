import { z } from "zod"

export const webdavSyncDataSchema = z.object({
    password: z.string(),
    username: z.string(),
    url: z.string(),
})

export const getWebdavSyncData = (data: Record<string, unknown>) => {
    return webdavSyncDataSchema.parse(data)
}