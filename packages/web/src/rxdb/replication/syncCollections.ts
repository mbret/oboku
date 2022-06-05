import { RxCollection, SyncOptions } from "rxdb"
import { combineLatest, map, merge, startWith, Subject } from "rxjs"
import { syncCollection } from "./syncCollection"

export const syncCollections = (
  collections: RxCollection[],
  syncOptions: () => SyncOptions
) => {
  const cancel$ = new Subject<boolean>()

  /**
   * We run all replication from every collections
   */
  const replications = collections.map((collection) => {
    return syncCollection(collection, syncOptions())
  })

  const cancel = () => {
    cancel$.next(true)
    cancel$.complete()

    return Promise.all(replications.map((replication) => replication.cancel()))
  }

  /**
   * Is active as long as one of the states is active
   */
  const active$ = combineLatest(
    replications.map((state) => state.active$.pipe(startWith(false)))
  ).pipe(
    // switchMap((observables) => combineLatest(observables)),
    map((values) => values.some((value) => value === true))
  )

  /**
   * Is alive as long as one of the states is active
   */
  const alive$ = combineLatest(
    replications.map((state) => state.alive$.pipe(startWith(false)))
  ).pipe(
    // switchMap((observables) => combineLatest(observables)),
    map((values) => values.some((value) => value === true))
  )

  /**
   * Is completed when all underlying states are completed
   */
  const complete$ = combineLatest(
    replications.map((state) => state.complete$.pipe(startWith(false)))
  ).pipe(
    // switchMap((observables) => combineLatest(observables)),
    map((values) => values.every((value) => !!value))
  )

  /**
   * Direct merge mapping of all underlying changes
   */
  const change$ = merge(...replications.map((state) => state.change$))

  const error$ = merge(...replications.map((state) => state.error$))

  cancel$.subscribe(() => {})

  return {
    cancel,
    alive$,
    error$,
    active$,
    complete$,
    change$
  }
}
