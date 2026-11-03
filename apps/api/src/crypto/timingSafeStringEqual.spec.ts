import { timingSafeStringEqual } from "./timingSafeStringEqual.js"

describe("timingSafeStringEqual", () => {
  it("returns true for equal strings", () => {
    expect(timingSafeStringEqual("admin", "admin")).toBe(true)
  })

  it("returns false for different strings of the same length", () => {
    expect(timingSafeStringEqual("admin", "admim")).toBe(false)
  })

  it("returns false for strings of different lengths", () => {
    expect(timingSafeStringEqual("admin", "administrator")).toBe(false)
  })
})
