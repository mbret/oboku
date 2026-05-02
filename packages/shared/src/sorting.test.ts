import { describe, expect, it } from "vitest"
import { compareDesc, sortByTitleComparator } from "./sorting"

describe(`sortByTitleComparator`, () => {
  it(`sorts plain strings alphabetically`, () => {
    expect([`a`, `b`].sort(sortByTitleComparator)).toEqual([`a`, `b`])
    expect([`b`, `a`].sort(sortByTitleComparator)).toEqual([`a`, `b`])
  })

  it(`sorts pure numeric strings naturally`, () => {
    expect([`1`, `2`].sort(sortByTitleComparator)).toEqual([`1`, `2`])
    expect([`2`, `1`].sort(sortByTitleComparator)).toEqual([`1`, `2`])
    expect([`10`, `2`].sort(sortByTitleComparator)).toEqual([`2`, `10`])
  })

  it(`sorts numbers naturally inside titles`, () => {
    expect([`foo 10`, `foo 11`].sort(sortByTitleComparator)).toEqual([
      `foo 10`,
      `foo 11`,
    ])
    expect([`foo 10`, `foo 2`].sort(sortByTitleComparator)).toEqual([
      `foo 2`,
      `foo 10`,
    ])
    expect(
      [`Series Vol. 12`, `Series Vol. 2`].sort(sortByTitleComparator),
    ).toEqual([`Series Vol. 2`, `Series Vol. 12`])
  })

  it(`falls back to text comparison when prefixes differ`, () => {
    expect([`foo 10`, `fpo 2`].sort(sortByTitleComparator)).toEqual([
      `foo 10`,
      `fpo 2`,
    ])
    expect([`a 10`, `b 2`].sort(sortByTitleComparator)).toEqual([`a 10`, `b 2`])
  })

  it(`returns 0 for equal strings`, () => {
    expect(sortByTitleComparator(`a`, `a`)).toBe(0)
    expect(sortByTitleComparator(``, ``)).toBe(0)
  })

  it(`treats leading zeros as the same number`, () => {
    expect(sortByTitleComparator(`Vol. 02`, `Vol. 2`)).toBe(0)
  })

  it(`is case- and accent-insensitive`, () => {
    expect(sortByTitleComparator(`abc`, `ABC`)).toBe(0)
    expect(sortByTitleComparator(`café`, `cafe`)).toBe(0)
  })
})

describe(`compareDesc`, () => {
  it(`orders ISO timestamps with the most recent first`, () => {
    const older = `2024-01-01T00:00:00.000Z`
    const newer = `2024-06-15T12:00:00.000Z`

    expect([older, newer].sort(compareDesc)).toEqual([newer, older])
    expect([newer, older].sort(compareDesc)).toEqual([newer, older])
  })

  it(`orders numbers with the largest first`, () => {
    expect([1, 3, 2].sort(compareDesc)).toEqual([3, 2, 1])
  })

  it(`orders Date instances with the most recent first`, () => {
    const older = new Date(`2024-01-01T00:00:00.000Z`)
    const newer = new Date(`2024-06-15T12:00:00.000Z`)

    expect([older, newer].sort(compareDesc)).toEqual([newer, older])
  })

  it(`returns 0 for equal values`, () => {
    expect(compareDesc(`2024-01-01`, `2024-01-01`)).toBe(0)
    expect(compareDesc(42, 42)).toBe(0)
  })
})
