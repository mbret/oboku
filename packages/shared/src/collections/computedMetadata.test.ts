import { expect, it } from "vitest"
import type { CollectionMetadata } from "../metadata"
import { computeCollectionMetadata } from "./computedMetadata"

it("should return an empty view when there is no metadata", () => {
  expect(computeCollectionMetadata([])).toEqual({})
})

it("should ignore undefined entries", () => {
  expect(computeCollectionMetadata([undefined, undefined])).toEqual({})
})

it("should let a higher priority source override a lower one", () => {
  const metadata: CollectionMetadata[] = [
    { type: "user", title: "user title" },
    { type: "googleBookApi", title: "google title" },
  ]

  expect(computeCollectionMetadata(metadata).title).toBe("user title")
})

it("should apply priority regardless of the entries order", () => {
  const metadata: CollectionMetadata[] = [
    { type: "user", title: "user title" },
    { type: "link", title: "link title" },
    { type: "comicvine", title: "comicvine title" },
  ]

  expect(computeCollectionMetadata(metadata).title).toBe("user title")
  expect(computeCollectionMetadata([...metadata].reverse()).title).toBe(
    "user title",
  )
})

it("should not let a lower priority source without the field erase it", () => {
  const metadata: CollectionMetadata[] = [
    { type: "user", startYear: 1999 },
    { type: "comicvine", publisherName: "acme" },
  ]

  expect(computeCollectionMetadata(metadata)).toEqual({
    startYear: 1999,
    publisherName: "acme",
  })
})

it("should not let a higher priority source without the field erase it", () => {
  const metadata: CollectionMetadata[] = [
    { type: "comicvine", startYear: 1999 },
    { type: "user", title: "user title" },
  ]

  expect(computeCollectionMetadata(metadata).startYear).toBe(1999)
})

it("should not let null erase an already resolved value", () => {
  const metadata: CollectionMetadata[] = [
    { type: "comicvine", rating: 4 },
    { type: "user", rating: null },
  ]

  expect(computeCollectionMetadata(metadata).rating).toBe(4)
})

it("should resolve the english title of a localized title", () => {
  const metadata: CollectionMetadata[] = [
    { type: "mangadex", title: { en: "en title", es: "es title" } },
  ]

  expect(computeCollectionMetadata(metadata).title).toBe("en title")
})

it("should merge fields coming from different sources", () => {
  const metadata: CollectionMetadata[] = [
    { type: "user", title: "user title" },
    { type: "comicvine", publisherName: "acme", startYear: 1999 },
    { type: "googleBookApi", description: "a description" },
  ]

  expect(computeCollectionMetadata(metadata)).toEqual({
    title: "user title",
    publisherName: "acme",
    startYear: 1999,
    description: "a description",
  })
})

it("should keep the last entry of two sources with the same priority", () => {
  const metadata: CollectionMetadata[] = [
    { type: "user", title: "first" },
    { type: "user", title: "second" },
  ]

  expect(computeCollectionMetadata(metadata).title).toBe("second")
})

it("should not mutate the given list", () => {
  const metadata: CollectionMetadata[] = [
    { type: "comicvine", title: "comicvine title" },
    { type: "user", title: "user title" },
  ]
  const originalOrder = [...metadata]

  computeCollectionMetadata(metadata)

  expect(metadata).toEqual(originalOrder)
})
