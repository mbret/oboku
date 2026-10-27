import { readFile } from "node:fs/promises"
import path from "node:path"
import { PageContent } from "./PageContent"

export default async function Page() {
  const markdown = await readFile(
    path.join(process.cwd(), "src/md/privacy-policy.md"),
    "utf8",
  )

  const content = markdown.replaceAll(
    // biome-ignore lint/suspicious/noTemplateCurlyInString: literal placeholder, not a template
    "${NEXT_PUBLIC_TRADEMARK}",
    process.env.NEXT_PUBLIC_TRADEMARK ?? "",
  )

  return <PageContent content={content} />
}
