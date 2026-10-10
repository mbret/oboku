import type { LookupAddress } from "node:dns"
import {
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
  it.each(["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111", "::ffff:8.8.8.8"])(
    "accepts %s",
    (address) => {
      expect(isPublicAddress(address)).toBe(true)
    },
  )

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
    "fd00::1",
    "fe80::1",
    "ff02::1",
    "2001:db8::1",
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
