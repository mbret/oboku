import {
  createContext,
  FC,
  ReactNode,
  useContext,
  useMemo,
} from "react"
import { PromiseReturnType } from "../types"
import { createDatabase } from "./databases"
import { useCreateDatabase } from "./useCreateDatabase"

const DatabaseContext = createContext<{
  db: PromiseReturnType<typeof createDatabase> | undefined
  reCreate: () => ReturnType<typeof createDatabase>
}>({ db: undefined, reCreate: () => ({} as any) })

export const RxDbProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { db, reCreate } = useCreateDatabase()

  const contextValue = useMemo(
    () => ({
      db,
      reCreate
    }),
    [db, reCreate]
  )

  console.log({ db })

  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  )
}

export const useDatabase = () => {
  const { db } = useContext(DatabaseContext)

  return db
}

export const useReCreateDb = () => {
  const { reCreate } = useContext(DatabaseContext)

  return reCreate
}
