import type createNano from "nano"
import { find } from "./dbHelpers.js"

/** The ids of the user's protected tags, which hide their books until the library is unlocked. */
export const findProtectedTagIds = async (
  db: createNano.DocumentScope<unknown>,
) => {
  const protectedTags = await find(db, "tag", {
    selector: { isProtected: true },
    fields: ["_id"],
  })

  return protectedTags.map(({ _id }) => _id)
}
