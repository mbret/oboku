import { extractDateComponents } from "./extractDateComponents"

describe("extractDateComponents", () => {
  it("extracts day of month and 1-based month from a full ISO date", () => {
    expect(extractDateComponents("2020-05-15")).toEqual({
      year: 2020,
      month: 5,
      day: 15,
    })
  })

  it("extracts components regardless of the weekday", () => {
    expect(extractDateComponents("2023-11-07")).toEqual({
      year: 2023,
      month: 11,
      day: 7,
    })
  })

  it("extracts only the year from a year-only string", () => {
    expect(extractDateComponents("1999")).toEqual({
      year: 1999,
      month: undefined,
      day: undefined,
    })
  })

  it("returns no components for undefined input", () => {
    expect(extractDateComponents(undefined)).toEqual({
      year: undefined,
      month: undefined,
      day: undefined,
    })
  })

  it("returns no components for an unparseable string", () => {
    expect(extractDateComponents("not a date")).toEqual({
      year: undefined,
      month: undefined,
      day: undefined,
    })
  })
})
