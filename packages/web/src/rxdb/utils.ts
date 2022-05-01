export const isPouchError = (
  err: PouchDB.Core.Error
): err is PouchDB.Core.Error =>
  (err as PouchDB.Core.Error).message !== undefined &&
  (err as PouchDB.Core.Error).error !== undefined &&
  (err as PouchDB.Core.Error).reason !== undefined &&
  (err as PouchDB.Core.Error).name !== undefined &&
  (err as PouchDB.Core.Error).status !== undefined
