import {
  formatAllowedHost,
  isAllowedHost,
  parseAllowedHost,
} from "./allowedHosts.js"

describe("parseAllowedHost", () => {
  it.each([
    ["nas.local", { hostname: "nas.local" }],
    [" NAS.Local:5001 ", { hostname: "nas.local", port: 5001 }],
    ["nas.local:80", { hostname: "nas.local", port: 80 }],
    ["192.168.1.20", { hostname: "192.168.1.20" }],
    ["fd00::1", { hostname: "fd00::1" }],
    ["[fd00::1]:3000", { hostname: "fd00::1", port: 3000 }],
    [
      "http://192.168.1.20:5005/kosync",
      { hostname: "192.168.1.20", port: 5005 },
    ],
    ["http://nas.local", { hostname: "nas.local", port: 80 }],
    ["https://nas.local/", { hostname: "nas.local", port: 443 }],
  ])("reads %s", (entry, allowedHost) => {
    expect(parseAllowedHost(entry)).toEqual(allowedHost)
  })

  it.each([
    "",
    "nas.local/books",
    "admin@nas.local",
    "nas.local:99999",
    "ftp://nas.local",
    "not a host",
  ])("refuses %j", (entry) => {
    expect(parseAllowedHost(entry)).toBeUndefined()
  })
})

describe("formatAllowedHost", () => {
  it.each([
    ["nas.local", "nas.local"],
    ["nas.local:5001", "nas.local:5001"],
    ["https://nas.local/webdav", "nas.local:443"],
    ["fd00::1", "[fd00::1]"],
    ["[fd00::1]:3000", "[fd00::1]:3000"],
  ])("writes %s as %s", (entry, formatted) => {
    const allowedHost = parseAllowedHost(entry)

    expect(allowedHost && formatAllowedHost(allowedHost)).toBe(formatted)
  })
})

describe("isAllowedHost", () => {
  const allowedHosts = [
    { hostname: "nas.local" },
    { hostname: "127.0.0.1", port: 3000 },
  ]

  it("allows every port of a host listed without one", () => {
    expect(
      isAllowedHost(allowedHosts, { hostname: "nas.local", port: 5001 }),
    ).toBe(true)
  })

  it("allows only the port listed with a host", () => {
    expect(
      isAllowedHost(allowedHosts, { hostname: "127.0.0.1", port: 3000 }),
    ).toBe(true)
    expect(
      isAllowedHost(allowedHosts, { hostname: "127.0.0.1", port: 5984 }),
    ).toBe(false)
  })

  it("does not allow other hosts", () => {
    expect(
      isAllowedHost(allowedHosts, { hostname: "10.0.0.5", port: 80 }),
    ).toBe(false)
  })
})
