import { type RxConflictHandler, defaultConflictHandler } from "rxdb"

export const conflictHandler: RxConflictHandler<any> = (i, context) => {
  if (!i.newDocumentState) {
    console.error("conflictHandler undefined newDocumentState", i)

    return Promise.resolve({
      isEqual: false,
      documentData: i.realMasterState,
    })
  }

  return defaultConflictHandler(i, context)
}
