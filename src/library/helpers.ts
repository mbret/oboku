import { LibraryDocType, useRxMutation } from "../databases"

export const useUpdateLibrary = () =>
  useRxMutation<Partial<LibraryDocType>>(
    (db, { variables }) =>
      db.library.safeUpdate({ $set: variables }, collection => collection.findOne())
  )