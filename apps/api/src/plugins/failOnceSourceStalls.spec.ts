import { setTimeout as wait } from "node:timers/promises"
import { describe, expect, it } from "vitest"
import {
  failOnceSourceStalls,
  SourceStalledError,
} from "./failOnceSourceStalls.js"

const MAX_IDLE_MS = 50

async function* yieldParts(parts: string[]) {
  yield* parts
}

async function* yieldOnePartThenStop() {
  yield "first"

  await new Promise<never>(function neverSettle() {})
}

async function* yieldOnePartThenFail(failure: Error) {
  yield "first"

  throw failure
}

const readAll = async (file: AsyncIterable<string>, readerPauseMs = 0) => {
  const parts: string[] = []

  for await (const part of file) {
    parts.push(part)
    await wait(readerPauseMs)
  }

  return parts
}

describe("failOnceSourceStalls", () => {
  it("passes every part of the file on, in order", async () => {
    const file = failOnceSourceStalls(
      yieldParts(["first", "second", "third"]),
      MAX_IDLE_MS,
    )

    expect(await readAll(file)).toEqual(["first", "second", "third"])
  })

  it("fails once the source takes longer than the limit to give its next part", async () => {
    const file = failOnceSourceStalls(yieldOnePartThenStop(), MAX_IDLE_MS)

    await expect(readAll(file)).rejects.toBeInstanceOf(SourceStalledError)
  })

  it("does not count the time its reader takes between two parts", async () => {
    const file = failOnceSourceStalls(
      yieldParts(["first", "second", "third"]),
      MAX_IDLE_MS,
    )
    const readerPauseMs = MAX_IDLE_MS * 3

    expect(await readAll(file, readerPauseMs)).toEqual([
      "first",
      "second",
      "third",
    ])
  })

  it("fails with the source's own failure", async () => {
    const sourceFailure = new Error("socket hang up")
    const file = failOnceSourceStalls(
      yieldOnePartThenFail(sourceFailure),
      MAX_IDLE_MS,
    )

    await expect(readAll(file)).rejects.toBe(sourceFailure)
  })
})
