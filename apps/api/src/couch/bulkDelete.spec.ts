import { describe, expect, it, vi } from "vitest"
import { bulkDelete } from "./bulkDelete.js"

const danglingLink = {
  _id: "link-1",
  _rev: "1-a",
  rx_model: "link",
  type: "webdav",
  book: null,
}
const changedLink = { ...danglingLink, _id: "link-2", _rev: "3-c" }

const createDb = () => ({
  bulk: vi.fn(async function answerBulkWrite() {
    return [
      { id: danglingLink._id, rev: "2-b", ok: true },
      {
        id: changedLink._id,
        rev: "",
        ok: false,
        error: "conflict",
        reason: "Document update conflict.",
      },
    ]
  }),
})

describe("bulkDelete", () => {
  it("deletes each document at its revision, keeping its fields", async () => {
    const db = createDb()

    await bulkDelete(db, [danglingLink, changedLink])

    expect(db.bulk).toHaveBeenCalledExactlyOnceWith({
      docs: [
        { ...danglingLink, _deleted: true },
        { ...changedLink, _deleted: true },
      ],
    })
  })

  it("resolves with the ids CouchDB deleted, leaving out those it refused", async () => {
    const db = createDb()

    const deletedIds = await bulkDelete(db, [danglingLink, changedLink])

    expect(deletedIds).toEqual([danglingLink._id])
  })
})
