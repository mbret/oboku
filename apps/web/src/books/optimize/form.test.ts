import { describe, expect, it } from "vitest"
import { parseDimension } from "./form"

describe("parseDimension", function testParseDimension() {
  it.each([
    ["", undefined],
    ["invalid", undefined],
    ["Infinity", undefined],
    ["-1", undefined],
    ["0", undefined],
    ["0.1", undefined],
    ["0.49", undefined],
    ["0.5", 1],
    ["1", 1],
    ["1.49", 1],
    ["1.5", 2],
  ])("parses %s as %s", function parseValue(value, expected) {
    expect(parseDimension(value)).toBe(expected)
  })
})
