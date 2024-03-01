/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { GoogleBooksApiResult } from "@libs/google/googleBooksApi"
import { parseGoogleMetadata } from "./parseGoogleMetadata"
import { describe, it, expect } from "vitest"

const getDefaultData = (): GoogleBooksApiResult => ({
  kind: `books#volumes`,
  totalItems: 1,
  items: [
    {
      etag: ``,
      id: ``,
      kind: ``,
      selfLink: ``,
      volumeInfo: {
        authors: [``],
        categories: [`Fiction`],
        imageLinks: {
          thumbnail: ``
        },
        language: ``,
        publishedDate: ``,
        publisher: ``,
        title: "My title Vol. 1"
      }
    }
  ]
})

describe(`Given has series info`, () => {
  describe(`and Vol is already present in the title`, () => {
    it(`should not add Vol in the title twice`, () => {
      const { title } = parseGoogleMetadata({
        ...getDefaultData(),
        items: [
          {
            ...(getDefaultData().items ?? [])[0]!,
            volumeInfo: {
              ...getDefaultData().items![0]!.volumeInfo,
              title: "My title Vol. 1",
              seriesInfo: {
                bookDisplayNumber: "1"
              }
            }
          }
        ]
      })

      expect(title).toBe(`My title Vol. 1`)
    })
  })

  describe(`and Vol is not present in the title`, () => {
    it(`should add Vol in the title`, () => {
      const { title } = parseGoogleMetadata({
        ...getDefaultData(),
        items: [
          {
            ...getDefaultData().items![0]!,
            volumeInfo: {
              ...getDefaultData().items![0]!.volumeInfo,
              title: "My title",
              seriesInfo: {
                bookDisplayNumber: "1"
              }
            }
          }
        ]
      })

      expect(title).toBe(`My title Vol 1`)
    })
  })
})

describe(`Given no series info`, () => {
  it(`should not add Vol information`, () => {
    const { title } = parseGoogleMetadata({
      ...getDefaultData(),
      items: [
        {
          ...getDefaultData().items![0]!,
          volumeInfo: {
            ...getDefaultData().items![0]!.volumeInfo,
            title: "My title",
            seriesInfo: undefined
          }
        }
      ]
    })

    expect(title).toBe(`My title`)
  })
})
