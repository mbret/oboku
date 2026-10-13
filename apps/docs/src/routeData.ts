import { getCollection } from "astro:content"
import { defineRouteMiddleware } from "@astrojs/starlight/route-data"

const docsEntryIdsWithSocialCard = new Set(
  (await getCollection("docs")).map((docsEntry) => docsEntry.id),
)

export const onRequest = defineRouteMiddleware((context) => {
  const { entry, head } = context.locals.starlightRoute
  // Starlight's route data gives the homepage the id "", its collection entry is "index"
  const docsEntryId = entry.id === "" ? "index" : entry.id

  if (!docsEntryIdsWithSocialCard.has(docsEntryId)) return

  const socialCardUrl = new URL(`/og/${docsEntryId}.png`, context.site).href

  head.push(
    { tag: "meta", attrs: { property: "og:image", content: socialCardUrl } },
    { tag: "meta", attrs: { name: "twitter:image", content: socialCardUrl } },
  )
})
