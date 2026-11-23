import { ObokuErrorCode } from "@oboku/shared"
import { describe, expect, it } from "vitest"
import { SyncReport } from "./SyncReport.js"

describe("SyncReport", () => {
  it("prepares a successful report without an error code", () => {
    const report = new SyncReport("data-source-1", "reader@example.com")

    expect(report.prepare()).toMatchObject({
      state: "success",
      error_code: null,
    })
  })

  it("prepares a failed report with the error code of the failure", () => {
    const report = new SyncReport("data-source-1", "reader@example.com")

    report.fail(ObokuErrorCode.ERROR_ADDRESS_NOT_ALLOWED)

    expect(report.prepare()).toMatchObject({
      state: "error",
      error_code: ObokuErrorCode.ERROR_ADDRESS_NOT_ALLOWED,
    })
  })
})
