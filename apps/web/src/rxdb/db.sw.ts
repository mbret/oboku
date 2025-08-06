import { createDatabase as createWebDatabase } from "./databases.shared"

export const createSwDatabase = () => {
  return createWebDatabase({
    // multiInstance: true,
  })
}
