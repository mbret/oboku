import { useSetRecoilState } from "recoil"
import { syncState } from "./states"

export const useSyncLibrary = () => {
  const setSyncState = useSetRecoilState(syncState)

  return () => setSyncState(old => ({ ...old, syncRefresh: old.syncRefresh + 1 }))
}

export const useToggleTag = () => (a: any) => console.error('todo')