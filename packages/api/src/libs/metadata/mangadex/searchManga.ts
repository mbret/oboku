import axios from "axios"

type Response = {
  result: "ok" | "unknown"
  response?: "collection" | "unknown"
  data?: Array<{
    id: string
    type: "manga" | "unknown"
    attributes: {
      title: {
        en?: string
      }
      altTitles: Array<Record<string, string>>
      description: {
        en?: string
      }
      isLocked: boolean
      links: {
        al?: string
        ap?: string
        bw?: string
        kt?: string
        mu?: string
        amz?: string
        cdj?: string
        ebj?: string
        mal?: string
        raw?: string
        engtl?: string
      }
      originalLanguage: string
      lastVolume: string
      lastChapter: string
      publicationDemographic: "shounen" | "unknown"
      status: "completed" | "unknown"
      year: number
      contentRating: "suggestive" | "unknown"
      tags: Array<{
        id: string
        type: "tag"
        attributes: {
          name: {
            en: "Reincarnation"
          }
          description: Record<string, unknown>
          group: "theme"
          version: 1
        }
        relationships: []
      }>
      state: "published" | "unknown"
      chapterNumbersResetOnNewVolume: boolean
      createdAt: string
      updatedAt: string
      version: number
      availableTranslatedLanguages: string[]
      latestUploadedChapter: string
    }
    relationships: Array<
      | {
          id: string
          type: "author" | "artist" | "manga"
          related?: "prequel" | "unknown"
        }
      | {
          id: string
          type: "cover_art"
          attributes: {
            fileName: string
            description: string
            volume: string
            locale: string
            version: number
            createdAt: string
            updatedAt: string
          }
        }
    >
  }>
  limit: number
  offset: number
  total: number
}

export const searchManga = async (title: string) => {
  const response = await axios<Response>({
    method: "get",
    url: "https://api.mangadex.org/manga",
    headers: {
      "Content-Type": "application/json"
    },
    params: {
      title,
      includes: ["cover_art"],
      order: {
        relevance: "desc"
      }
    }
  })

  const { url, params } = response.config

  console.log(`[mangadex.searchManga] url: ${JSON.stringify({ url, params })}`)

  return response
}
