import { getForwardedProto } from "./forwardedProto"

describe("getForwardedProto", () => {
  it("returns undefined when the header is absent", () => {
    expect(getForwardedProto(undefined)).toBeUndefined()
    expect(getForwardedProto("")).toBeUndefined()
  })

  it("returns the single scheme unchanged", () => {
    expect(getForwardedProto("https")).toBe("https")
  })

  it("takes the outermost hop of a comma-joined chain", () => {
    expect(getForwardedProto("https, http")).toBe("https")
    expect(getForwardedProto("http,https")).toBe("http")
  })

  it("takes the first entry of a repeated header", () => {
    expect(getForwardedProto(["https", "http"])).toBe("https")
  })
})
