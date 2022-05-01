import React, {
  createContext,
  FC,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react"
import { useMountedState } from "react-use"
import { PromiseReturnType } from "../types"
import { createDatabase } from "./databases"

const DatabaseContext = createContext<{
  db: PromiseReturnType<typeof createDatabase> | undefined
  reCreate: () => ReturnType<typeof createDatabase>
}>({ db: undefined, reCreate: () => ({} as any) })

export const RxDbProvider: FC = ({ children }) => {
  const [db, setDb] = useState<
    PromiseReturnType<typeof createDatabase> | undefined
  >(undefined)
  const isMounted = useMountedState()

  const reCreate = useCallback(async () => {
    setDb(undefined)
    // at this point we expect useDatabase to be rendered
    // again with undefined database. So that nothing should interact with
    // the db while it's being recreated
    await db?.remove()
    const newDb = await createDatabase()

    if (isMounted()) {
      setDb(newDb)
    }

    return newDb
  }, [db, isMounted])

  useEffect(() => {
    ;(async () => {
      const newDb = await createDatabase()
      if (isMounted()) {
        setDb(newDb)
      }
    })()
  }, [setDb, isMounted])

  const contextValue = useMemo(
    () => ({
      db,
      reCreate
    }),
    [db, reCreate]
  )

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
