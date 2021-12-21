import { sortByTitleComparator } from "./sorting"

it(`should sort correctly`, () => {
  expect([`a`, `b`].sort(sortByTitleComparator)).toEqual([`a`, `b`])
  expect([`b`, `a`].sort(sortByTitleComparator)).toEqual([`a`, `b`])
  expect([`1`, `2`].sort(sortByTitleComparator)).toEqual([`1`, `2`])
  expect([`2`, `1`].sort(sortByTitleComparator)).toEqual([`1`, `2`])
  expect([`10`, `2`].sort(sortByTitleComparator)).toEqual([`2`, `10`])
  expect([`foo 10`, `foo 11`].sort(sortByTitleComparator)).toEqual([`foo 10`, `foo 11`])
  expect([`foo 10`, `foo 2`].sort(sortByTitleComparator)).toEqual([`foo 2`, `foo 10`])
  expect([`foo 10`, `fpo 2`].sort(sortByTitleComparator)).toEqual([`foo 10`, `fpo 2`])
  expect([`a 10`, `b 2`].sort(sortByTitleComparator)).toEqual([`a 10`, `b 2`])
})
