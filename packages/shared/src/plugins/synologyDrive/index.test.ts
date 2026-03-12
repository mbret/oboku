import { describe, expect, it } from "vitest"
import {
  explodeSynologyDriveResourceId,
  generateSynologyDriveResourceId,
} from "./index"

describe("Synology Drive plugin helpers", () => {
  it("generates resource id with synology-drive prefix", () => {
    expect(
      generateSynologyDriveResourceId({
        fileId: "123456",
      }),
    ).toBe("synology-drive://123456")
  })

  it("extracts the file id from canonical prefixed format", () => {
    expect(explodeSynologyDriveResourceId("synology-drive://123456")).toEqual({
      fileId: "123456",
    })
  })

  it("still extracts the file id from legacy raw format", () => {
    expect(explodeSynologyDriveResourceId("123456")).toEqual({
      fileId: "123456",
    })
  })

  it("supports file ids with reserved characters", () => {
    const resourceId = generateSynologyDriveResourceId({
      fileId: "id:with/slash",
    })

    expect(resourceId).toBe("synology-drive://id%3Awith%2Fslash")
    expect(explodeSynologyDriveResourceId(resourceId)).toEqual({
      fileId: "id:with/slash",
    })
  })

  it("explodes prefixed format with encoded file id", () => {
    expect(
      explodeSynologyDriveResourceId("synology-drive://id%3Awith%2Fslash"),
    ).toEqual({
      fileId: "id:with/slash",
    })
  })
})
