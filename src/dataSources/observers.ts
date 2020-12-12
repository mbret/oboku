import { useEffect, useState } from "react"
import { useRecoilState, UnwrapRecoilValue } from "recoil"
import { RxChangeEvent } from "rxdb"
import { useDatabase } from "../rxdb"
import { DataSourceDocType } from 'oboku-shared'
import { normalizedDataSourcesState } from "./states"
import { Report } from "../report"

export const useDataSourcesInitialState = () => {
  const db = useDatabase()
  const [, setDataSources] = useRecoilState(normalizedDataSourcesState)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (db) {
      (async () => {
        try {
          const dataSources = await db.datasource.find().exec()
          const dataSourcesAsMap = dataSources.reduce((map: UnwrapRecoilValue<typeof normalizedDataSourcesState>, obj) => {
            map[obj._id] = obj.toJSON()
            return map
          }, {})
          setDataSources(dataSourcesAsMap)

          setIsReady(true)
        } catch (e) {
          Report.error(e)
        }
      })()
    }
  }, [db, setDataSources])

  return isReady
}

export const useDataSourcesObservers = () => {
  const db = useDatabase()
  const [, setDataSources] = useRecoilState(normalizedDataSourcesState)

  useEffect(() => {
    db?.datasource.$.subscribe((changeEvent: RxChangeEvent<DataSourceDocType>) => {
      console.warn('CHANGE EVENT', changeEvent)
      switch (changeEvent.operation) {
        case 'INSERT': {
          return setDataSources(state => ({
            ...state,
            [changeEvent.documentData._id]: changeEvent.documentData,
          }))
        }
        case 'UPDATE': {
          return setDataSources(state => ({
            ...state,
            [changeEvent.documentData._id]: changeEvent.documentData,
          }))
        }
        case 'DELETE': {
          return setDataSources(({ [changeEvent.documentData._id]: deletedDataSource, ...rest }) => rest)
        }
      }
    })
  }, [db, setDataSources])
}