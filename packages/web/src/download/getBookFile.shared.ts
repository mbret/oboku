import { BookFile } from "./types"
import localforage from 'localforage';
import { DOWNLOAD_PREFIX } from "../constants.shared";

export const getBookFile = (bookId: string) => {
  console.warn(`${DOWNLOAD_PREFIX}-${bookId}`)
  
  return localforage.getItem<BookFile>(`${DOWNLOAD_PREFIX}-${bookId}`)
}