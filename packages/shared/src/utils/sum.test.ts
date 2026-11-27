import { describe, expect, it } from "vitest"
import { sum } from "./sum"

describe("sum", () => {
  it("adds the values", () => {
    expect(sum([1, 2, 3])).toBe(6)
  })

  it("gives 0 for no values", () => {
    expect(sum([])).toBe(0)
  })
})
