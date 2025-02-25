import { headers } from "next/headers"

export const getServerMarkdownContent = async (
  path: "terms-and-conditions" | "privacy-policy" | "about-us",
) => {
  const origin =
    process.env.NODE_ENV === "development"
      ? `http://${(await headers()).get("host")}`
      : `https://${(await headers()).get("host")}`

  const response = await fetch(
    `${origin}/api/markdown?path=${encodeURIComponent(path)}`,
    {
      method: "get",
    },
  )

  return response
}
