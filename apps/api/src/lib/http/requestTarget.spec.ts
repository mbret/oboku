import dns from "node:dns"
import {
  assertSafeRequestTarget,
  UnsafeRequestTargetError,
} from "./requestTarget"

const mockLookup = jest.spyOn(dns.promises, "lookup")

const resolvesTo = (...addresses: string[]) => {
  mockLookup.mockResolvedValue(
    addresses.map((address) => ({
      address,
      family: address.includes(":") ? 6 : 4,
    })) as never,
  )
}

beforeEach(() => {
  mockLookup.mockReset()
})

describe("assertSafeRequestTarget", () => {
  const options = { allowPrivateNetwork: false }

  it("accepts a host resolving to public space", async () => {
    resolvesTo("152.19.134.47")

    await expect(
      assertSafeRequestTarget("https://www.gutenberg.org/x.epub", options),
    ).resolves.toBeUndefined()
  })

  it("rejects a host resolving to a private address", async () => {
    resolvesTo("192.168.1.5")

    await expect(
      assertSafeRequestTarget("http://nas.local/book.epub", options),
    ).rejects.toThrow(UnsafeRequestTargetError)
  })

  it("rejects when any of several records is private", async () => {
    resolvesTo("1.1.1.1", "127.0.0.1")

    await expect(
      assertSafeRequestTarget("https://split-horizon.test/x", options),
    ).rejects.toThrow(UnsafeRequestTargetError)
  })

  it("rejects an ip literal in private space without resolving", async () => {
    await expect(
      assertSafeRequestTarget(
        "http://169.254.169.254/latest/meta-data",
        options,
      ),
    ).rejects.toThrow(UnsafeRequestTargetError)

    expect(mockLookup).not.toHaveBeenCalled()
  })

  it("accepts a private target when the instance opted in", async () => {
    await expect(
      assertSafeRequestTarget("http://192.168.1.5/book.epub", {
        allowPrivateNetwork: true,
      }),
    ).resolves.toBeUndefined()

    expect(mockLookup).not.toHaveBeenCalled()
  })

  it("rejects non-http protocols", async () => {
    await expect(
      assertSafeRequestTarget("file:///etc/passwd", options),
    ).rejects.toThrow(UnsafeRequestTargetError)

    await expect(
      assertSafeRequestTarget("gopher://example.org", {
        allowPrivateNetwork: true,
      }),
    ).rejects.toThrow(UnsafeRequestTargetError)
  })

  it("rejects a malformed url", async () => {
    await expect(assertSafeRequestTarget("not a url", options)).rejects.toThrow(
      UnsafeRequestTargetError,
    )
  })

  it("rejects a host that cannot be resolved", async () => {
    mockLookup.mockRejectedValue(new Error("ENOTFOUND"))

    await expect(
      assertSafeRequestTarget("https://nope.invalid/x", options),
    ).rejects.toThrow(UnsafeRequestTargetError)
  })
})
