import type { Response } from "express"

export function handleOptions(res: Response) {
  res.status(200).set({ DAV: "1", Allow: "OPTIONS, GET, HEAD, PROPFIND" }).end()
}
