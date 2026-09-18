import dns from "node:dns"
import { createSafeLookup, UnsafeRequestTargetError } from "./requestTarget"

type LookupRecord = { address: string; family: number }

const mockLookup = jest.spyOn(dns, "lookup")

const resolvesTo = (...addresses: string[]) => {
  mockLookup.mockImplementation(((
    _hostname: string,
    _options: unknown,
    callback: (
      error: NodeJS.ErrnoException | null,
      records: LookupRecord[],
    ) => void,
  ) => {
    callback(
      null,
      addresses.map((address) => ({
        address,
        family: address.includes(":") ? 6 : 4,
      })),
    )
  }) as never)
}

const lookupOnce = (
  lookup: typeof dns.lookup,
  options: dns.LookupOneOptions | dns.LookupAllOptions = { family: 0 },
) =>
  new Promise<{ error: unknown; result: unknown; family?: number }>(
    (resolve) => {
      ;(lookup as unknown as Function)(
        "provider.example.org",
        options,
        (error: unknown, result: unknown, family?: number) =>
          resolve({ error, result, family }),
      )
    },
  )

beforeEach(() => {
  mockLookup.mockReset()
})

describe("createSafeLookup", () => {
  const guarded = () => createSafeLookup({ allowPrivateNetwork: false })

  it("passes through a hostname resolving to public space", async () => {
    resolvesTo("152.19.134.47")

    const { error, result, family } = await lookupOnce(guarded())

    expect(error).toBeNull()
    expect(result).toBe("152.19.134.47")
    expect(family).toBe(4)
  })

  it("fails the connection for a private address", async () => {
    resolvesTo("192.168.1.5")

    const { error } = await lookupOnce(guarded())

    expect(error).toBeInstanceOf(UnsafeRequestTargetError)
  })

  it("fails when any of several records is private", async () => {
    resolvesTo("1.1.1.1", "127.0.0.1")

    const { error } = await lookupOnce(guarded())

    expect(error).toBeInstanceOf(UnsafeRequestTargetError)
  })

  it("fails for the cloud metadata address", async () => {
    resolvesTo("169.254.169.254")

    const { error } = await lookupOnce(guarded())

    expect(error).toBeInstanceOf(UnsafeRequestTargetError)
  })

  it("fails for an ipv4-mapped ipv6 pointing at loopback", async () => {
    resolvesTo("::ffff:127.0.0.1")

    const { error } = await lookupOnce(guarded())

    expect(error).toBeInstanceOf(UnsafeRequestTargetError)
  })

  it("allows a private address when the instance opted in", async () => {
    resolvesTo("192.168.1.5")

    const { error, result } = await lookupOnce(
      createSafeLookup({ allowPrivateNetwork: true }),
    )

    expect(error).toBeNull()
    expect(result).toBe("192.168.1.5")
  })

  it("returns every record when the caller asked for all", async () => {
    resolvesTo("1.1.1.1", "9.9.9.9")

    const { error, result } = await lookupOnce(guarded(), { all: true })

    expect(error).toBeNull()
    expect(result).toEqual([
      { address: "1.1.1.1", family: 4 },
      { address: "9.9.9.9", family: 4 },
    ])
  })

  it("fails when the resolver returns nothing", async () => {
    resolvesTo()

    const { error } = await lookupOnce(guarded())

    expect(error).toBeInstanceOf(UnsafeRequestTargetError)
  })

  it("propagates a resolver failure unchanged", async () => {
    const resolverError = new Error("ENOTFOUND")

    mockLookup.mockImplementation(((
      _hostname: string,
      _options: unknown,
      callback: (error: unknown) => void,
    ) => {
      callback(resolverError)
    }) as never)

    const { error } = await lookupOnce(guarded())

    expect(error).toBe(resolverError)
  })

  it("always resolves all records so a split answer cannot be missed", async () => {
    resolvesTo("1.1.1.1")

    await lookupOnce(guarded(), { family: 4 })

    expect(mockLookup).toHaveBeenCalledWith(
      "provider.example.org",
      expect.objectContaining({ all: true, family: 4 }),
      expect.any(Function),
    )
  })
})
