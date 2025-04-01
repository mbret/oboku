import axios from "axios"

type Result = {
  author: string
  authorURL: string
  bookURL: string
  cover: string
  id: number
  rating: string
  title: string
}

export const getBooks = (title: string) => {
  return axios<{ result: Result[] }>({
    method: "post",
    url: "https://biblioreads.eu.org/api/search/books",
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      queryURL: `https://www.goodreads.com/search?q=${encodeURIComponent(title)}`,
    },
  })
}
