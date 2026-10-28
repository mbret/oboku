import { parseBasicAuthorization } from "./basicAuthorization.js"

const encode = (credentials: string) =>
  Buffer.from(credentials, "utf8").toString("base64")

const toBasicHeader = (credentials: string) => `Basic ${encode(credentials)}`

describe("parseBasicAuthorization", () => {
  it("splits the credentials at the first colon", () => {
    expect(
      parseBasicAuthorization(toBasicHeader("reader@example.com:pa:ss")),
    ).toEqual({ username: "reader@example.com", password: "pa:ss" })
  })

  it("reads credentials encoded as UTF-8", () => {
    expect(parseBasicAuthorization(toBasicHeader("lecteur:été"))).toEqual({
      username: "lecteur",
      password: "été",
    })
  })

  it.each(["basic", "BASIC", "bAsIc"])("reads the %s scheme", (scheme) => {
    expect(
      parseBasicAuthorization(
        `${scheme} ${encode("reader@example.com:pa:ss")}`,
      ),
    ).toEqual({ username: "reader@example.com", password: "pa:ss" })
  })

  it.each([
    ["another scheme", `Bearer ${encode("reader@example.com:pa:ss")}`],
    ["no space after the scheme", `Basic${encode("reader@example.com:pa:ss")}`],
  ])("ignores %s", (_case, header) => {
    expect(parseBasicAuthorization(header)).toBeUndefined()
  })
})
