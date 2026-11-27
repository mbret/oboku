import type { Mock } from "vitest"
import type createNano from "nano"
import { mapUserDatabases } from "./mapUserDatabases.js"
import type { UserDatabase } from "./listUserDatabases.js"

type Step = (userDatabase: UserDatabase, progress: string) => Promise<number>

const userDbName = (email: string) =>
  `userdb-${Buffer.from(email).toString("hex")}`

const missingDb = Object.assign(new Error("not found"), {
  statusCode: 404,
  reason: "Database does not exist.",
})

describe("mapUserDatabases", () => {
  let findUsers: Mock
  let listDatabases: Mock
  let db: createNano.ServerScope

  beforeEach(() => {
    findUsers = vi.fn().mockResolvedValue({
      docs: [
        { name: "a@example.com" },
        { name: "gone@example.com" },
        { name: "b@example.com" },
      ],
    })
    listDatabases = vi
      .fn()
      .mockResolvedValue(
        ["a@example.com", "gone@example.com", "b@example.com"].map(userDbName),
      )
    // A fake with only the members `listUserDatabases` reads.
    db = {
      use: vi.fn(() => ({ find: findUsers })),
      db: { list: listDatabases },
    } as unknown as createNano.ServerScope
  })

  it("returns the result of the step on each database, and skips one that disappears", async () => {
    const step = vi.fn<Step>(async function countEmailLength({ email }) {
      if (email === "gone@example.com") throw missingDb

      return email.length
    })

    const results = await mapUserDatabases(db, step)

    expect(results).toEqual(["a@example.com".length, "b@example.com".length])
    expect(
      step.mock.calls.map(([{ email }, progress]) => [email, progress]),
    ).toEqual([
      ["a@example.com", "[1/3]"],
      ["gone@example.com", "[2/3]"],
      ["b@example.com", "[3/3]"],
    ])
  })

  it("stops on any other error", async () => {
    const step = vi.fn<Step>(async function failOnCouch() {
      throw new Error("couch is down")
    })

    await expect(mapUserDatabases(db, step)).rejects.toThrow("couch is down")
    expect(step).toHaveBeenCalledTimes(1)
  })
})
