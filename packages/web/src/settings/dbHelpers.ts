import { from, map } from "rxjs"
import { Database } from "../rxdb"

export const getSettings = (db: Database) =>
  getSettingsDocument(db).pipe(map((entry) => entry?.toJSON()))

export const getSettingsDocument = (db: Database) =>
  from(db.settings.findOne().exec())
