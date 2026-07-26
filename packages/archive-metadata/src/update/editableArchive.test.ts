// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { type EditableArchive, toArchive } from "./editableArchive"

describe("editableArchive", () => {
  it("exposes lazy records with byte sizes through the archive view", () => {
    const entries: EditableArchive = new Map([
      ["note.txt", { dir: false, content: "abcde" }],
    ])

    const record = toArchive(entries).records[0]

    expect(record).toMatchObject({ dir: false, uri: "note.txt", size: 5 })
  })
})
