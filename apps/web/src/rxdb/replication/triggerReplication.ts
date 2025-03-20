import { Subject } from "rxjs"

const resyncSubject = new Subject<void>()

export const triggerReplication = () => resyncSubject.next()

export const triggerReplication$ = resyncSubject.asObservable()
