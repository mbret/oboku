import type createNano from "nano"
import { USER_DB_INDEXES, ensureUserDbIndexes } from "./userDbIndexes"

const createDb = (
  createIndex: jest.Mock,
): Pick<createNano.DocumentScope<unknown>, "createIndex"> => ({
  createIndex,
})

describe("ensureUserDbIndexes", () => {
  it("creates every index in its own design document", async () => {
    const createIndex = jest.fn().mockImplementation(async ({ name }) => ({
      result: "created",
      id: `_design/idx-${name}`,
      name,
    }))

    const result = await ensureUserDbIndexes(createDb(createIndex))

    expect(createIndex).toHaveBeenCalledTimes(USER_DB_INDEXES.length)
    expect(createIndex.mock.calls.map(([request]) => request)).toEqual(
      USER_DB_INDEXES.map((index) => ({
        index: { fields: [...index.fields] },
        name: index.name,
        ddoc: `idx-${index.name}`,
        type: "json",
      })),
    )
    expect(result).toEqual({
      created: USER_DB_INDEXES.map((index) => index.name),
      existing: [],
    })
  })

  it("reports indexes CouchDB already had", async () => {
    const createIndex = jest.fn().mockImplementation(async ({ name }) => ({
      result: name === "rx_model" ? "exists" : "created",
      id: `_design/idx-${name}`,
      name,
    }))

    const result = await ensureUserDbIndexes(createDb(createIndex))

    expect(result.existing).toEqual(["rx_model"])
    expect(result.created).toEqual(
      USER_DB_INDEXES.filter((index) => index.name !== "rx_model").map(
        (index) => index.name,
      ),
    )
  })

  it("rethrows a non-retryable CouchDB failure", async () => {
    const forbidden = Object.assign(new Error("forbidden"), { statusCode: 403 })
    const createIndex = jest.fn().mockRejectedValue(forbidden)

    await expect(ensureUserDbIndexes(createDb(createIndex))).rejects.toBe(
      forbidden,
    )
    expect(createIndex).toHaveBeenCalledTimes(1)
  })
})
