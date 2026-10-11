import type { LookupAddress } from "node:dns"
import {
  isNonPublicAddressError,
  isPublicAddress,
  lookupPublicAddress,
  NonPublicAddressError,
} from "./publicAddress.js"

const resolvedAddresses = vi.hoisted(() => ({
  current: [] as LookupAddress[],
}))

vi.mock("node:dns", () => ({
  lookup: (
    _hostname: string,
    _options: unknown,
    callback: (error: Error | null, addresses: LookupAddress[]) => void,
  ) => callback(null, resolvedAddresses.current),
}))

const lookup = (hostname: string, options: { all?: boolean } = {}) =>
  new Promise<{
    error: Error | null
    address: string | LookupAddress[]
    family?: number
  }>((resolve) => {
    lookupPublicAddress(hostname, options, (error, address, family) =>
      resolve({ error, address, family }),
    )
  })

describe("isPublicAddress", () => {
  it.each([
    "8.8.8.8",
    "1.1.1.1",
    "2606:4700:4700::1111",
    "2001:4860:4860::8888",
    "::ffff:8.8.8.8",
    "64:ff9b::808:808",
  ])("accepts %s", (address) => {
    expect(isPublicAddress(address)).toBe(true)
  })

  it.each([
    "0.0.0.0",
    "10.1.2.3",
    "100.64.0.1",
    "127.0.0.1",
    "169.254.169.254",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.10",
    "198.18.0.1",
    "224.0.0.1",
    "255.255.255.255",
    "::",
    "::1",
    "::ffff:127.0.0.1",
    "::ffff:a9fe:a9fe",
    "64:ff9b::a9fe:a9fe",
    "64:ff9b::10.0.0.5",
    "64:ff9b:1::a00:5",
    "100:0:0:1::1",
    "2001::1",
    "2001:2::1",
    "2001:db8::1",
    "2002:a00:1::1",
    "3fff::1",
    "5f00::1",
    "fd00::1",
    "fe80::1",
    "ff02::1",
    "not an address",
  ])("refuses %s", (address) => {
    expect(isPublicAddress(address)).toBe(false)
  })
})

describe("lookupPublicAddress", () => {
  it("answers with the first address of a public host", async () => {
    resolvedAddresses.current = [
      { address: "93.184.215.14", family: 4 },
      { address: "2606:2800:21f:cb07:6820:80da:af6b:8b2c", family: 6 },
    ]

    expect(await lookup("example.com")).toEqual({
      error: null,
      address: "93.184.215.14",
      family: 4,
    })
  })

  it("answers with every address when asked for all", async () => {
    resolvedAddresses.current = [{ address: "93.184.215.14", family: 4 }]

    const { address } = await lookup("example.com", { all: true })

    expect(address).toEqual([{ address: "93.184.215.14", family: 4 }])
  })

  it("refuses a host with any non-public address", async () => {
    resolvedAddresses.current = [
      { address: "93.184.215.14", family: 4 },
      { address: "10.0.0.5", family: 4 },
    ]

    const { error } = await lookup("rebinding.example")

    expect(error).toBeInstanceOf(NonPublicAddressError)
  })

  it("refuses a host that resolves to nothing", async () => {
    resolvedAddresses.current = []

    const { error } = await lookup("nowhere.example")

    expect(error).toBeInstanceOf(NonPublicAddressError)
  })
})

describe("isNonPublicAddressError", () => {
  it("recognizes the refusal itself", () => {
    expect(isNonPublicAddressError(new NonPublicAddressError("10.0.0.5"))).toBe(
      true,
    )
  })

  it("recognizes it as the cause of another error", () => {
    const wrapped = new Error("request failed", {
      cause: new Error("connection failed", {
        cause: new NonPublicAddressError("10.0.0.5"),
      }),
    })

    expect(isNonPublicAddressError(wrapped)).toBe(true)
  })

  it("recognizes an error that only copied its code", () => {
    const copied = Object.assign(new Error("request failed"), {
      code: new NonPublicAddressError("10.0.0.5").code,
    })

    expect(isNonPublicAddressError(copied)).toBe(true)
  })

  it("does not recognize other errors", () => {
    const refusedConnection = Object.assign(new Error("connect failed"), {
      code: "ECONNREFUSED",
    })

    expect(isNonPublicAddressError(refusedConnection)).toBe(false)
    expect(isNonPublicAddressError("ERR_NON_PUBLIC_ADDRESS")).toBe(false)
  })
})
