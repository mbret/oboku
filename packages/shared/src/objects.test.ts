import { isShallowEqual } from "./objects"
import { expect, test } from "vitest"

test(`shallow comparision`, () => {
  const base = { a: 1, b: 2 }
  expect(isShallowEqual(base, { a: 1, b: 2 })).toBe(true)
  expect(isShallowEqual(base, { a: 1, b: 3 })).toBe(false)
  expect(isShallowEqual(base, { a: 1, b: 2, c: 3 })).toBe(false)
  expect(isShallowEqual(base, { a: 1 })).toBe(false)
  expect(isShallowEqual([], [])).toBe(true)
  expect(isShallowEqual([0], [0])).toBe(true)
  expect(isShallowEqual([0, 1, 2], [0, 1, 2])).toBe(true)
  expect(isShallowEqual([0, 1, 2], [0, 2, 1])).toBe(false)
  expect(isShallowEqual([0], [1])).toBe(false)
})

test(`not support deep comparision`, () => {
  const base = { a: { b: 2 } }
  expect(isShallowEqual(base, { a: { b: 2 } })).toBe(false)
})

test(`null === null`, () => {
  expect(isShallowEqual(null, null)).toBe(true)
})

test(`null !== {}`, () => {
  expect(isShallowEqual({}, null)).toBe(false)
  expect(isShallowEqual(null, {})).toBe(false)
})
