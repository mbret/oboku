import type { BookMetadata } from "@oboku/shared"
import { describe, expect, it } from "vitest"
import { getMetadataFromBook } from "./index"

const link: BookMetadata = {
  type: "link",
  title: "Mistborn [oboku~isbn~42].epub",
}

const file: BookMetadata = {
  type: "file",
  contentType: "application/epub+zip",
  metadata: {
    titles: [{ value: "The Final Empire" }],
    identifiers: [{ scheme: "ISBN", value: "9780765311788" }],
  },
}

const catalog: BookMetadata = {
  type: "catalog",
  version: 1,
  providerId: "googleBooks",
  score: 1,
  accepted: true,
  signals: [],
  metadata: {
    titles: [{ value: "Mistborn: The Final Empire" }],
    description: "Ash falls from the sky.",
  },
}

describe("getMetadataFromBook, with entries in prose-reader's shapes", () => {
  it("merges the file above the catalog by default", () => {
    const metadata = getMetadataFromBook({ metadata: [link, catalog, file] })

    expect(metadata.title).toBe("The Final Empire")
    expect(metadata.description).toBe("Ash falls from the sky.")
  })

  it("puts the catalog first when the book says so", () => {
    expect(
      getMetadataFromBook({
        metadata: [link, catalog, file],
        metadataSourcePriority: ["catalog", "file"],
      }).title,
    ).toBe("Mistborn: The Final Empire")
  })

  it("reads the catalog's legacy name in a priority older versions wrote", () => {
    expect(
      getMetadataFromBook({
        metadata: [link, catalog, file],
        metadataSourcePriority: ["googleBookApi", "file"],
      }).title,
    ).toBe("Mistborn: The Final Empire")
  })

  it("keeps the filename's directives above the file", () => {
    expect(getMetadataFromBook({ metadata: [link, file] }).isbn).toBe("42")
  })
})

describe("getMetadataFromBook, with entries stored before", () => {
  const legacyFile: BookMetadata = { type: "file", title: "The Final Empire" }
  const legacyCatalog: BookMetadata = {
    type: "googleBookApi",
    title: "Mistborn: The Final Empire",
    description: "Ash falls from the sky.",
  }

  it("merges them as the file and the catalog", () => {
    const metadata = getMetadataFromBook({
      metadata: [link, legacyCatalog, legacyFile],
    })

    expect(metadata.title).toBe("The Final Empire")
    expect(metadata.description).toBe("Ash falls from the sky.")
  })

  it("ranks a legacy catalog entry where the priority puts the catalog", () => {
    expect(
      getMetadataFromBook({
        metadata: [link, legacyCatalog, legacyFile],
        metadataSourcePriority: ["catalog", "file"],
      }).title,
    ).toBe("Mistborn: The Final Empire")
  })
})
