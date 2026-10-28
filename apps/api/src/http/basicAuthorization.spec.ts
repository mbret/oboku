import { parseBasicAuthorization } from "./basicAuthorization.js"

const toBasicHeader = (credentials: string) =>
  `Basic ${Buffer.from(credentials, "utf8").toString("base64")}`

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
})
