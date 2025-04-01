import { createDatabase as createWebDatabase } from "./databases"

export const createSwDatabase = () => {
  return createWebDatabase({
    ignoreDuplicate: false,
  })
}
