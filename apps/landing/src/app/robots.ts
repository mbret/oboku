import type { MetadataRoute } from "next"
import { links } from "@oboku/shared"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${links.site}/sitemap.xml`,
  }
}
