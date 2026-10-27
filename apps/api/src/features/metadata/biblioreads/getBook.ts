import axios from "axios"

type Result = {
  seriesURL?: string
  statusCode: number
}

export const getBook = (bookUrl: string) => {
  const url = new URL(`https://www.goodreads.com${bookUrl}`)

  return axios<Result>({
    method: "post",
    url: "https://biblioreads.eu.org/api/book-scraper",
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      queryURL: `${url.origin}${url.pathname}`,
    },
  })
}
