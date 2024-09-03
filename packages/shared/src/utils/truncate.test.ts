import { describe, it, expect } from "vitest"
import { truncate } from "./truncate" // Adjust the import path as needed

describe("truncate", () => {
  it("should return the original string if it is shorter than or equal to the max length", () => {
    expect(truncate("Short", { length: 10 })).toBe("Short")
    expect(truncate("ExactLength", { length: 11 })).toBe("ExactLength")
  })

  it("should truncate the string and add the omission string when necessary", () => {
    expect(truncate("Hello, World!", { length: 5 })).toBe("Hell...")
    expect(
      truncate("Truncate this sentence.", { length: 8, omission: "--" })
    ).toBe("Truncat--")
    expect(truncate("A long string with many characters", { length: 15 })).toBe(
      "A long string ..."
    )
  })

  it("should handle edge cases for empty strings", () => {
    expect(truncate("", { length: 5 })).toBe("")
  })

  it("should handle edge cases for very small maxLength values", () => {
    expect(truncate("Small", { length: 0 })).toBe("")
    expect(truncate("Small", { length: -1 })).toBe("")
    expect(truncate("Edge", { length: 2 })).toBe("E...")
  })

  it("should handle the case where maxLength is less than the omission length", () => {
    expect(truncate("Hello", { length: 2 })).toBe("H...")
    expect(truncate("Hello", { length: 1 })).toBe("...")
  })

  it("should handle the case where omission length is equal to maxLength", () => {
    expect(
      truncate("This is a test string", { length: 3, omission: "..." })
    ).toBe("Th...")
  })

  it("should return the correct result when omission is a custom string", () => {
    expect(truncate("Hello, World!", { length: 7, omission: "***" })).toBe(
      "Hello,***"
    )
    expect(
      truncate("Custom omission test", { length: 12, omission: " [cut]" })
    ).toBe("Custom omis [cut]")
  })

  it("should handle multi-byte characters correctly", () => {
    expect(truncate("こんにちは世界", { length: 5 })).toBe("こんにち...")
  })

  it("should handle strings that contain only omission length correctly", () => {
    expect(truncate("Hello", { length: 3, omission: "---" })).toBe("He---")
  })

  it("should handle very long strings efficiently", () => {
    const longString = "a".repeat(100000)
    expect(truncate(longString, { length: 100 })).toBe("a".repeat(99) + "...")
  })
})
