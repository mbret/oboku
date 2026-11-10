import { getOutermostForwardedValue } from "./forwardedHeader.js"

describe("getOutermostForwardedValue", () => {
  it("returns undefined when the header is absent", () => {
    expect(getOutermostForwardedValue(undefined)).toBeUndefined()
    expect(getOutermostForwardedValue("")).toBeUndefined()
  })

  it("returns the single scheme unchanged", () => {
    expect(getOutermostForwardedValue("https")).toBe("https")
  })

  it("takes the outermost hop of a comma-joined chain", () => {
    expect(getOutermostForwardedValue("https, http")).toBe("https")
    expect(getOutermostForwardedValue("http,https")).toBe("http")
  })

  it("takes the first entry of a repeated header", () => {
    expect(getOutermostForwardedValue(["https", "http"])).toBe("https")
  })
})
