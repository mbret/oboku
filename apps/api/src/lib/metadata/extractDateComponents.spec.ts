import { extractDateComponents } from "./extractDateComponents"

describe("extractDateComponents", () => {
  it("extracts the calendar day and 1-based month from a full date", () => {
    expect(extractDateComponents("2015-10-21")).toEqual({
      year: 2015,
      month: 10,
      day: 21,
    })
  })

  it("keeps a year-only value as just the year", () => {
    expect(extractDateComponents("2015")).toEqual({
      year: 2015,
      month: undefined,
      day: undefined,
    })
  })

  it("returns no components for an empty or unparseable value", () => {
    expect(extractDateComponents("")).toEqual({
      year: undefined,
      month: undefined,
      day: undefined,
    })
    expect(extractDateComponents("not a real date")).toEqual({
      year: undefined,
      month: undefined,
      day: undefined,
    })
  })
})
