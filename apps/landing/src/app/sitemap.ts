import type { MetadataRoute } from "next"
import { links } from "@oboku/shared"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: links.site },
    { url: `${links.site}/contact` },
    { url: `${links.site}/privacy-policy` },
  ]
}
