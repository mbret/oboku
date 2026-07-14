import { describe, expect, it } from "vitest"
import { findAlternatesNotSharingApiHostname } from "./envs.shared"

describe("findAlternatesNotSharingApiHostname", () => {
  it("accepts alternates that differ from the API origin by port only", () => {
    expect(
      findAlternatesNotSharingApiHostname("http://localhost:3000", [
        "http://localhost:5985",
        "http://localhost:5986",
        "http://localhost:3000",
      ]),
    ).toEqual([])
  })

  it("flags alternates on a different hostname, deduplicated", () => {
    expect(
      findAlternatesNotSharingApiHostname("https://api.example.com", [
        "https://api2.example.com",
        "https://api2.example.com",
        "https://api.example.com",
      ]),
    ).toEqual(["https://api2.example.com"])
  })

  it("flags alternates that are not valid urls", () => {
    expect(
      findAlternatesNotSharingApiHostname("https://api.example.com", [
        "not-a-url",
      ]),
    ).toEqual(["not-a-url"])
  })

  it("stays quiet when the api url is not configured", () => {
    expect(
      findAlternatesNotSharingApiHostname("", ["https://api2.example.com"]),
    ).toEqual([])
  })
})
