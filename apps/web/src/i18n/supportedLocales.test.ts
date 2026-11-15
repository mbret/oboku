import { describe, expect, it } from "vitest"
import { pickSupportedLocale } from "./supportedLocales"

describe("pickSupportedLocale", () => {
  it.each([
    { languages: ["fr-CA"], expected: "fr" },
    { languages: ["de-DE", "fr-FR"], expected: "fr" },
    { languages: ["en-US", "fr-FR"], expected: "en" },
    { languages: ["de-DE"], expected: "en" },
    { languages: [], expected: "en" },
  ])("picks $expected from $languages", ({ languages, expected }) => {
    expect(pickSupportedLocale(languages)).toBe(expected)
  })
})
