import { isPrivateAddress } from "./privateNetwork"

describe("isPrivateAddress", () => {
  it("accepts public ipv4 addresses", () => {
    expect(isPrivateAddress("1.1.1.1")).toBe(false)
    expect(isPrivateAddress("152.19.134.47")).toBe(false)
    expect(isPrivateAddress("172.15.0.1")).toBe(false)
    expect(isPrivateAddress("172.32.0.1")).toBe(false)
  })

  it("rejects loopback, private and link-local ipv4 ranges", () => {
    expect(isPrivateAddress("127.0.0.1")).toBe(true)
    expect(isPrivateAddress("10.0.0.5")).toBe(true)
    expect(isPrivateAddress("192.168.1.5")).toBe(true)
    expect(isPrivateAddress("172.16.0.1")).toBe(true)
    expect(isPrivateAddress("172.31.255.255")).toBe(true)
    expect(isPrivateAddress("100.64.0.1")).toBe(true)
    expect(isPrivateAddress("0.0.0.0")).toBe(true)
  })

  it("rejects the cloud metadata address", () => {
    expect(isPrivateAddress("169.254.169.254")).toBe(true)
  })

  it("rejects multicast and reserved ipv4 space", () => {
    expect(isPrivateAddress("224.0.0.1")).toBe(true)
    expect(isPrivateAddress("255.255.255.255")).toBe(true)
  })

  it("accepts public ipv6 addresses", () => {
    expect(isPrivateAddress("2606:4700:4700::1111")).toBe(false)
  })

  it("rejects loopback, unique-local and link-local ipv6 ranges", () => {
    expect(isPrivateAddress("::1")).toBe(true)
    expect(isPrivateAddress("::")).toBe(true)
    expect(isPrivateAddress("fc00::1")).toBe(true)
    expect(isPrivateAddress("fd12:3456::1")).toBe(true)
    expect(isPrivateAddress("fe80::1")).toBe(true)
    expect(isPrivateAddress("ff02::1")).toBe(true)
  })

  it("rejects ipv4-mapped ipv6 pointing at private space", () => {
    expect(isPrivateAddress("::ffff:127.0.0.1")).toBe(true)
    expect(isPrivateAddress("::ffff:192.168.0.1")).toBe(true)
    expect(isPrivateAddress("::ffff:1.1.1.1")).toBe(false)
  })

  it("treats anything unparseable as private", () => {
    expect(isPrivateAddress("not-an-ip")).toBe(true)
    expect(isPrivateAddress("")).toBe(true)
  })
})
