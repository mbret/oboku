import axios from "axios"

type Response = {
  result: "ok" | "unknown"
}

export const getManga = async (id: string) => {
  return axios<Response>({
    method: "get",
    url: `https://api.mangadex.org/manga/${id}`,
    headers: {
      "Content-Type": "application/json",
    },
  })
}
