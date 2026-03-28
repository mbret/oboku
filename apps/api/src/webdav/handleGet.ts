import type { Response } from "express"
import fs from "node:fs"
import { lookup } from "mime-types"
import type { Logger } from "@nestjs/common"

export async function handleGet(
  res: Response,
  fsPath: string,
  headOnly: boolean,
  logger: Logger,
) {
  let stats: fs.Stats

  try {
    stats = await fs.promises.stat(fsPath)
  } catch {
    res.status(404).end()

    return
  }

  if (stats.isDirectory()) {
    res.status(405).end()

    return
  }

  const mimeType = lookup(fsPath) || "application/octet-stream"

  res.set({
    "Content-Type": mimeType,
    "Content-Length": String(stats.size),
    "Last-Modified": stats.mtime.toUTCString(),
    ETag: `"${stats.ino}-${stats.mtimeMs}-${stats.size}"`,
  })

  if (headOnly) {
    res.status(200).end()

    return
  }

  const stream = fs.createReadStream(fsPath)

  stream.pipe(res)

  stream.on("error", (error) => {
    logger.error(`File stream error: ${fsPath}`, error)

    if (!res.headersSent) {
      res.status(500).end()
    } else {
      res.destroy()
    }
  })
}
