import { useSetRecoilState } from "recoil"
import { LibraryDocType, useRxMutation } from "../rxdb"
import { syncState } from "./states"

export const useUpdateLibrary = () =>
  useRxMutation<Partial<LibraryDocType>>(
    (db, { variables }) =>
      db.library.safeUpdate({ $set: variables }, collection => collection.findOne())
  )

export const useSyncLibrary = () => {
  const setSyncState = useSetRecoilState(syncState)

  return () => setSyncState(old => ({ ...old, syncRefresh: old.syncRefresh + 1 }))
}

export const useToggleTag = () => (a: any) => console.error('todo')