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
    relationships: Array<{
      id: "string"
      type: "author" | "artist" | "cover_art" | "manga"
      related?: "prequel" | "unknown"
    }>
  }>
  limit: number
  offset: number
  total: number
}

export const searchManga = async (title: string) => {
  return axios<Response>({
    method: "get",
    url: "https://api.mangadex.org/manga",
    headers: {
      "Content-Type": "application/json"
    },
    params: {
      title
    }
  })
}
