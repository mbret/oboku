// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import type { ArchiveFileRecord } from "../archive/types"
import { measureAverageImageResolution } from "./inspect"

const imageRecord = (index: number): ArchiveFileRecord => ({
  dir: false,
  basename: `${index}.jpg`,
  uri: `${index}.jpg`,
  size: 1,
  blob: async function createImageBlob() {
    return new Blob([index.toString()])
  },
  arrayBuffer: async function createImageArrayBuffer() {
    return new ArrayBuffer(1)
  },
})

afterEach(function restoreGlobals() {
  vi.unstubAllGlobals()
})

describe("measureAverageImageResolution", () => {
  it("bounds concurrent image decoding and closes every bitmap", async () => {
    let activeDecodes = 0
    let peakActiveDecodes = 0
    const close = vi.fn()

    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async function decodeImage() {
        activeDecodes += 1
        peakActiveDecodes = Math.max(peakActiveDecodes, activeDecodes)

        await new Promise<void>(function waitForConcurrentDecodes(resolve) {
          setTimeout(resolve, 5)
        })

        activeDecodes -= 1

        return { width: 1200, height: 1800, close }
      }),
    )

    const records = Array.from(
      { length: 8 },
      function createImageRecord(_value, index) {
        return imageRecord(index)
      },
    )

    await expect(measureAverageImageResolution(records, 8)).resolves.toEqual({
      width: 1200,
      height: 1800,
    })
    expect(peakActiveDecodes).toBe(2)
    expect(close).toHaveBeenCalledTimes(8)
  })
})
