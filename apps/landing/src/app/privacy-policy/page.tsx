import { getServerMarkdownContent } from "../../features/api/getServerMarkdownContent"
import { PageContent } from "./PageContent"

export default async function Page() {
  const response = await getServerMarkdownContent("privacy-policy")

  const content = response.status === 200 ? await response.text() : ""

  return <PageContent content={content} />
}
