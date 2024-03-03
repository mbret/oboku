import { describe, expect, test } from "vitest"
import {
  removeArtistAndPublisher,
  removeZeroDigitFromVolumeNumber,
  renameVolumeNumber
} from "./refineTitle"

describe("replaceString function", () => {
  test('Replaces "something v02" correctly', () => {
    expect(renameVolumeNumber("something v02")).toBe("something vol 02")
    expect(renameVolumeNumber("something")).toBe("something")
    expect(renameVolumeNumber("something v04 foo")).toBe("something vol 04 foo")
    expect(renameVolumeNumber("something v04 ")).toBe("something vol 04 ")
    expect(renameVolumeNumber("something vfoo ")).toBe("something vfoo ")
    expect(renameVolumeNumber("something v4f ")).toBe("something v4f ")
  })

  test("Remove 0 digits from volume numbers", () => {
    expect(removeZeroDigitFromVolumeNumber("something vol 02")).toBe(
      "something vol 2"
    )
    expect(removeZeroDigitFromVolumeNumber("something")).toBe("something")
    expect(removeZeroDigitFromVolumeNumber("something vol 04 foo")).toBe(
      "something vol 4 foo"
    )
    expect(removeZeroDigitFromVolumeNumber("something vol 04 ")).toBe(
      "something vol 4 "
    )
    expect(removeZeroDigitFromVolumeNumber("something vfoo ")).toBe(
      "something vfoo "
    )
    expect(removeZeroDigitFromVolumeNumber("something v4f ")).toBe(
      "something v4f "
    )
  })

  test('Replaces "something v02 [foo] (bar)" correctly', () => {
    expect(removeArtistAndPublisher("something v02 [foo] (bar)")).toBe(
      "something v02"
    )
    expect(removeArtistAndPublisher("something v02 [foo] (bar) asdasd")).toBe(
      "something v02 asdasd"
    )
    expect(removeArtistAndPublisher("something vol 02 [foo] (bar)")).toBe(
      "something vol 02"
    )
    expect(removeArtistAndPublisher("something")).toBe("something")
    expect(removeArtistAndPublisher("something v04 foo")).toBe(
      "something v04 foo"
    )
    expect(removeArtistAndPublisher("something v04 ")).toBe("something v04 ")
    expect(removeArtistAndPublisher("something vfoo ")).toBe("something vfoo ")
    expect(removeArtistAndPublisher("something v4f ")).toBe("something v4f ")
    expect(removeArtistAndPublisher("something v4f [foo] (bar)")).toBe(
      "something v4f"
    )
  })
})
