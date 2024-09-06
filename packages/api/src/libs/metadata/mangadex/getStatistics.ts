import axios from "axios"

type Response = {
  result: "ok" | "unknown"
  statistics?: Record<
    string,
    {
      rating?: {
        average?: number
        bayesian?: number
      }
    }
  >
}

export const getStatistics = async (ids: string[]) => {
  return axios<Response>({
    method: "get",
    url: "https://api.mangadex.org/statistics/manga",
    headers: {
      "Content-Type": "application/json"
    },
    params: {
      manga: ids
    }
  })
}
