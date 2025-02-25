/**
 * @important
 * This API is not secure, it will load regardlessly any content provided
 * under messages/markdowns
 */
import path from "path"
import { promises as fs } from "fs"
import type { NextApiRequest, NextApiResponse } from "next"
import { extractParams } from "../../utils/extractParams"

const DEFAULT_LOCALE = "en"

const loadFile = async (dir: string, locale: string) => {
  const file = await fs.readFile(`${dir}.md`, "utf8")

  const withEnv = file.replaceAll(
    "${NEXT_PUBLIC_TRADEMARK}",
    process.env.NEXT_PUBLIC_TRADEMARK ?? "",
  )

  return withEnv
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { locale, path: filePath } = extractParams(req.query, {
    locale: "string",
    path: "string",
  })

  if (!filePath) {
    return res.status(400).send("")
  }

  const directory = path.join(process.cwd(), "src/md", filePath)

  try {
    const fileContents = await loadFile(directory, "en")

    return res.status(200).send(fileContents)
  } catch (error) {
    console.error(error)

    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      try {
        const fileContents = await loadFile(directory, DEFAULT_LOCALE)

        return res.status(200).send(fileContents)
      } catch (lastError) {
        console.error(lastError)
      }
    }

    return res.status(500).send("")
  }
}
