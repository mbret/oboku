import localforage from "localforage"
import { DOWNLOAD_PREFIX } from "../constants.shared"

export const getBookKeysFromStorage = async () =>
  (await localforage.keys())
    .filter((key) => key.startsWith(DOWNLOAD_PREFIX))
    .map((key) => ({ key, bookId: key.replace(`${DOWNLOAD_PREFIX}-`, "") }))
