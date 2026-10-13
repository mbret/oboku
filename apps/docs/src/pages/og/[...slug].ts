import { getCollection } from "astro:content"
import { OGImageRoute } from "astro-og-canvas"

const docsPageDataById = Object.fromEntries(
  (await getCollection("docs")).map((entry) => [entry.id, entry.data]),
)

export const { getStaticPaths, GET } = await OGImageRoute({
  pages: docsPageDataById,
  getSlug: (docsEntryId) => `${docsEntryId}.png`,
  getImageOptions: (_docsEntryId, docsPageData) => ({
    title: docsPageData.title,
    description: "prose",
    bgGradient: [
      [190, 208, 243],
      [255, 255, 255],
    ],
    padding: 80,
    fonts: [
      "./node_modules/@fontsource/inter/files/inter-latin-700-normal.woff2",
      "./node_modules/@fontsource/inter/files/inter-latin-600-normal.woff2",
    ],
    font: {
      title: {
        families: ["Inter"],
        weight: "Bold",
        size: 80,
        lineHeight: 1.1,
        color: [52, 109, 219],
      },
      description: {
        families: ["Inter"],
        weight: "SemiBold",
        size: 40,
        color: [17, 24, 39],
      },
    },
  }),
})
