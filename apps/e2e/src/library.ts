import path from "node:path"

const BOOKS_DIR = path.join(import.meta.dirname, "../fixtures/books")

type Book = {
  fileName: string
  path: string
  title: string
  author: string
}

function book(fileName: string, title: string, author: string): Book {
  return { fileName, path: path.join(BOOKS_DIR, fileName), title, author }
}

export const THE_TIME_MACHINE = {
  ...book("h-g-wells_the-time-machine.epub", "The Time Machine", "H. G. Wells"),
  titlePage: {
    path: "/epub/text/titlepage.xhtml",
    imageName: "The Time Machine, by H. G. Wells",
  },
  chapterOne: {
    path: "/epub/text/chapter-1.xhtml",
    opening: "The Time Traveller (for so it will be convenient",
  },
}

export const TREASURE_ISLAND = book(
  "robert-louis-stevenson_treasure-island.epub",
  "Treasure Island",
  "Robert Louis Stevenson",
)

export const LITTLE_NEMO = book(
  "winsor-mccay_little-nemo-in-slumberland.cbz",
  "Little Nemo in Slumberland",
  "Winsor McCay",
)

export const HITO_NO_ISSHO = book(
  "ippei-okamoto_hito-no-issho.cbz",
  "人の一生",
  "岡本一平",
)

/** The file has no title or author that the API reads. */
export const THE_TIME_MACHINE_AUDIOBOOK = book(
  "h-g-wells_the-time-machine_librivox.zip",
  "h-g-wells_the-time-machine_librivox.zip",
  "Unknown",
)

/**
 * Every book in fixtures/books. The server library test and the screenshot
 * setup expect each one in a synced library.
 */
export const SERVER_LIBRARY_BOOKS: Book[] = [
  THE_TIME_MACHINE,
  book(
    "jane-austen_pride-and-prejudice.epub",
    "Pride and Prejudice",
    "Jane Austen",
  ),
  book("mary-shelley_frankenstein.epub", "Frankenstein", "Mary Shelley"),
  book(
    "arthur-conan-doyle_the-adventures-of-sherlock-holmes.epub",
    "The Adventures of Sherlock Holmes",
    "Arthur Conan Doyle",
  ),
  TREASURE_ISLAND,
  LITTLE_NEMO,
  HITO_NO_ISSHO,
  THE_TIME_MACHINE_AUDIOBOOK,
]
