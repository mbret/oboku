import { readFile } from "node:fs/promises"
import path from "node:path"
import { MarkdownPage } from "../../features/common/MarkdownPage"

export default async function Page() {
  const content = await readFile(
    path.join(process.cwd(), "src/md/delete-account.md"),
    "utf8",
  )

  return <MarkdownPage content={content} />
}
