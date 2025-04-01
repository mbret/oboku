import { expect, it } from "vitest"
import { intersection } from "./intersection"

it("should return an array of unique values present in all arrays", () => {
  expect(intersection([2, 1], [2, 3])).toEqual([2])
  expect(intersection([1, 2, 3], [2, 3, 4], [3, 4])).toEqual([3])
})

it("should handle arrays with no common elements", () => {
  expect(intersection([1, 2], [3, 4])).toEqual([])
})

it("should return an empty array if all arrays are empty", () => {
  expect(intersection([], [], [])).toEqual([])
})

it("should return an empty array if there are no valid arrays", () => {
  expect(intersection(null, undefined)).toEqual([])
})

it("should handle a mix of valid and null or undefined arrays", () => {
  expect(intersection([1, 2, 3], null, [3, 4])).toEqual([3])
  expect(intersection([1, 2, 3], undefined, [2, 3], null)).toEqual([2, 3])
})

it("should handle arrays with duplicate values correctly", () => {
  expect(intersection([1, 2, 2, 3], [2, 2, 3, 3], [2, 3])).toEqual([2, 3])
})

it("should handle arrays containing various types correctly", () => {
  expect(intersection([1, "a", true], ["a", 1], [1, "a"])).toEqual([1, "a"])
})

it("should handle arrays with objects correctly", () => {
  const obj1 = { a: 1 }
  const obj2 = { b: 2 }
  expect(intersection([obj1, obj2], [obj2, obj1], [obj1])).toEqual([obj1])
})

it("should handle arrays with NaN correctly", () => {
  expect(intersection([NaN, 1, 2], [NaN, 3, 4], [NaN])).toEqual([NaN])
})

it("should handle arrays with special values like undefined and null", () => {
  expect(
    intersection([undefined, null, 1], [1, undefined], [undefined]),
  ).toEqual([undefined])
})

it("should return all elements when all arrays are the same", () => {
  expect(intersection([1, 2, 3], [1, 2, 3], [1, 2, 3])).toEqual([1, 2, 3])
})

it("should handle very large arrays efficiently", () => {
  const largeArray = Array.from({ length: 10000 }, (_, i) => i)
  expect(intersection(largeArray, largeArray)).toEqual(largeArray)
})
