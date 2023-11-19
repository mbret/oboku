import { RxCollection, SyncOptions } from "rxdb"
import {
  BehaviorSubject,
  catchError,
  EMPTY,
  from,
  merge,
  Observable,
  Subject,
  switchMap,
  takeUntil,
  tap
} from "rxjs"
import { isNotNullOrUndefined } from "../../common/isNotNullOrUndefined"

type CouchDbReplication = ReturnType<RxCollection[`syncCouchDB`]>
const FIELD = `rx_model`

export const syncCollection = (
  collection: RxCollection,
  syncOptions: Omit<SyncOptions, `remote`> & { remote: PouchDB.Database }
) => {
  let terminated = false
  let filterCreationInterval: ReturnType<typeof setTimeout>
  let couchDbReplication$ = new BehaviorSubject<CouchDbReplication | undefined>(
    undefined
  )
  const cancel$ = new Subject<boolean>()
  const internalError$ = new Subject<unknown>()

  const error$ = merge(
    internalError$,
    couchDbReplication$.pipe(
      isNotNullOrUndefined(),
      switchMap((state) => state?.error$)
      // tap((value) => {
      //   console.log(`sync error$ ${collection.name}`, { value })
      // })
    )
  )

  const alive$ = couchDbReplication$.pipe(
    isNotNullOrUndefined(),
    switchMap((state) => state?.alive$)
    // tap((value) => {
    //   console.log(`sync alive$ ${collection.name}`, { value })
    // })
  )

  const active$ = couchDbReplication$.pipe(
    isNotNullOrUndefined(),
    switchMap((state) => state?.active$)
    // tap((value) => {
    //   console.log(`sync active$ ${collection.name}`, { value })
    // })
  )

  const change$: Observable<any> = couchDbReplication$.pipe(
    isNotNullOrUndefined(),
    switchMap((state) => state.change$)
    // tap((value) => {
    //   console.log(`sync change$ ${collection.name}`, { value })
    // })
  )

  const complete$: Observable<boolean | { pull: {}; push: {} }> =
    couchDbReplication$.pipe(
      isNotNullOrUndefined(),
      switchMap((state) => state.complete$)
      // tap((value) => {
      //   console.log(`sync complete$ ${collection.name}`, { value })
      // })
    )

  const cancel = () => {
    cancel$.next(true)
    cancel$.complete()

    return couchDbReplication$.value?.cancel() || Promise.resolve(true)
  }

  const sync = () => {
    const couchDbReplication = collection.syncCouchDB({
      ...syncOptions,
      options: {
        ...syncOptions.options,
        // filter: "app/by_model" as any,
        // @ts-ignore
        selector: {
          [FIELD]: collection.name
        }
        // query_params: { [FIELD]: collection.name }
      }
    })

    couchDbReplication$.next(couchDbReplication)
  }

  const createFilter = async () => {
    // https://pouchdb.com/2015/04/05/filtered-replication.html
    const field = FIELD
    const db = syncOptions.remote
    const doc = {
      version: 0,
      _id: "_design/app",
      filters: {
        // not doing fn.toString() as istambul code
        // on tests breaks it
        by_model: `function(doc, req) {
          return (
            doc._id === '_design/app' || doc["${field}"] === req.query["${field}"]
          );
        }`
      }
    }

    try {
      const meta = await db.get<typeof doc>("_design/app")
      if (meta.version < doc.version) {
        await db.put({ ...doc, _rev: meta?._rev })
      }
    } catch (e) {
      if ((e as any)?.status === 404) {
        await db.put(doc)
      } else {
        throw e
      }
    } finally {
      // only close db if it's not used by underlying replication
      // db.close()
    }
  }

  const tryToCreateFilter = async () => {
    await new Promise<void>(async (resolve) => {
      try {
        await createFilter()
        resolve()
      } catch (e) {
        if (terminated) return resolve()
        internalError$.next(e as any)
        if (!syncOptions.options?.retry) {
          await cancel()
          return resolve()
        }
        filterCreationInterval = setTimeout(() => {
          tryToCreateFilter().then(resolve)
        }, 5000)
      }
    })
  }

  from(tryToCreateFilter())
    .pipe(
      takeUntil(cancel$),
      tap(sync),
      catchError((err) => {
        internalError$.next(err)

        return EMPTY
      })
    )
    .subscribe()

  cancel$.subscribe(() => {
    terminated = true
    clearTimeout(filterCreationInterval as unknown as number)

    try {
      syncOptions.remote.close()
    } catch (e) {}

    internalError$.complete()
  })

  return {
    cancel,
    alive$,
    error$,
    active$,
    change$,
    complete$,
    collection
  }
}
