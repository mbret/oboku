import { ObservedValueOf, Subject } from "rxjs"

const toggleDatasourceProtectedSubject = new Subject<string>()

export const toggleDatasourceProtected = (
  options: ObservedValueOf<typeof toggleDatasourceProtectedSubject>
) => toggleDatasourceProtectedSubject.next(options)

export const toggleDatasourceProtected$ =
  toggleDatasourceProtectedSubject.asObservable()
