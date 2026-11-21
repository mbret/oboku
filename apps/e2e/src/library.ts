import path from "node:path"

const BOOKS_DIR = path.join(import.meta.dirname, "../fixtures/books")

const theTimeMachineFileName = "h-g-wells_the-time-machine.epub"

export const THE_TIME_MACHINE = {
  fileName: theTimeMachineFileName,
  path: path.join(BOOKS_DIR, theTimeMachineFileName),
  titlePageImageName: "The Time Machine, by H. G. Wells",
}
