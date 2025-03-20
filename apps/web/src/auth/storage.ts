import { createLocalStorageAdapter } from "reactjrx"

export const authSignalStorageAdapter = createLocalStorageAdapter({
  key: `auth`,
})
