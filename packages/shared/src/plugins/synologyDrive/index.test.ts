import { describe, expect, it } from "vitest"
import {
  explodeSynologyDriveResourceId,
  generateSynologyDriveResourceId,
} from "./index"

describe("Synology Drive plugin helpers", () => {
  it("generates resource id as raw file id (no prefix)", () => {
    expect(
      generateSynologyDriveResourceId({
        fileId: "123456",
      }),
    ).toBe("123456")
  })

  it("extracts the file id from new format (raw file id)", () => {
    expect(explodeSynologyDriveResourceId("123456")).toEqual({
      fileId: "123456",
    })
  })

  it("extracts the file id from old format (with prefix)", () => {
    expect(explodeSynologyDriveResourceId("synology-drive://123456")).toEqual({
      fileId: "123456",
    })
  })

  it("supports file ids with reserved characters", () => {
    const resourceId = generateSynologyDriveResourceId({
      fileId: "id:with/slash",
    })

    expect(resourceId).toBe("id:with/slash")
    expect(explodeSynologyDriveResourceId(resourceId)).toEqual({
      fileId: "id:with/slash",
    })
  })

  it("explodes old format with encoded file id", () => {
    expect(
      explodeSynologyDriveResourceId("synology-drive://id%3Awith%2Fslash"),
    ).toEqual({
      fileId: "id:with/slash",
    })
  })
})
