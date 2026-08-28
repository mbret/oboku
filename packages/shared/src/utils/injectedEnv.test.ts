import { describe, expect, it } from "vitest"
import { readInjectedEnv } from "./injectedEnv"

describe("readInjectedEnv", () => {
  it("returns undefined for a placeholder the entrypoint did not substitute", () => {
    expect(readInjectedEnv("__VITE_API_URL__")).toBeUndefined()
    expect(readInjectedEnv("__VITE_API_URL_2__")).toBeUndefined()
  })

  it("returns the substituted value", () => {
    expect(readInjectedEnv("https://api.example.com")).toBe(
      "https://api.example.com",
    )
  })

  it("returns an empty substitution as-is so callers treat it as unset", () => {
    expect(readInjectedEnv("")).toBe("")
  })

  it("does not mistake a value that merely contains underscores for a placeholder", () => {
    expect(readInjectedEnv("https://api.example.com/__health__")).toBe(
      "https://api.example.com/__health__",
    )
  })
})
