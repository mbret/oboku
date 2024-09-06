import { expect, it } from "vitest"
import { difference } from "./difference"

difference([5])

it(`should return the difference of two arrays`, () => {
  const actual = difference([2, 1], [2, 3])
  expect(actual).toEqual([1])
})

it(`should return the difference of multiple arrays`, () => {
  const actual = difference([2, 1, 2, 3], [3, 4], [3, 2])
  expect(actual).toEqual([1])
})

it("should return an empty array if the first array is empty", () => {
  expect(difference([], [1, 2, 3])).toEqual([])
})

it("should return the first array if all subsequent arrays are empty", () => {
  expect(difference([1, 2, 3], [], [])).toEqual([1, 2, 3])
})

it("should return the difference between the first array and multiple subsequent arrays", () => {
  expect(difference([2, 1, 5, 3], [2, 3], [1])).toEqual([5])
})

it("should return an empty array if the first array is completely covered by subsequent arrays", () => {
  expect(difference([1, 2, 3], [1], [2], [3])).toEqual([])
})

it("should return the first array if no elements are in any of the subsequent arrays", () => {
  expect(difference([1, 2, 3], [4, 5, 6], [7, 8, 9])).toEqual([1, 2, 3])
})

it("should handle arrays with duplicate elements correctly across multiple arrays", () => {
  expect(difference([1, 2, 2, 3, 4], [2, 3], [4])).toEqual([1])
})

it("should handle strings correctly across multiple arrays", () => {
  expect(difference(["a", "b", "c"], ["b"], ["a"])).toEqual(["c"])
})

it("should handle mixed types correctly across multiple arrays", () => {
  expect(difference([1, "a", 3, "b"], [1], ["b"], [3])).toEqual(["a"])
})

it("should handle objects correctly across multiple arrays", () => {
  const obj1 = { a: 1 }
  const obj2 = { b: 2 }
  const obj3 = { c: 3 }
  expect(difference([obj1, obj2, obj3], [obj2], [obj3])).toEqual([obj1])
})

it("should handle NaN correctly across multiple arrays", () => {
  expect(difference([NaN, 1, 2], [NaN], [1])).toEqual([2]) // NaN is treated differently in JavaScript
})

it("should handle special values like undefined and null across multiple arrays", () => {
  expect(difference([undefined, null, 1], [null], [1])).toEqual([undefined])
})

it("should handle very large arrays efficiently across multiple arrays", () => {
  const largeArray1 = Array.from({ length: 1000000 }, (_, i) => i)
  const largeArray2 = [1, 2, 3]
  const largeArray3 = [4, 5, 6]
  expect(difference(largeArray1, largeArray2, largeArray3).length).toBe(999994)
})

it("should return an empty array if the first array is undefined", () => {
  expect(difference(undefined, [1, 2, 3])).toEqual([])
})

it("should return an empty array if the first array is null", () => {
  expect(difference(null, [1, 2, 3])).toEqual([])
})

it("should return an empty array if the first array is undefined and there are no other arrays", () => {
  expect(difference(undefined)).toEqual([])
})

it("should return an empty array if the first array is null and there are no other arrays", () => {
  expect(difference(null)).toEqual([])
})

it("should handle a valid first array and undefined subsequent arrays correctly", () => {
  expect(difference([1, 2, 3], undefined, [2])).toEqual([1, 3])
})

it("should handle a valid first array and null subsequent arrays correctly", () => {
  expect(difference([1, 2, 3], null, [2])).toEqual([1, 3])
})

it("should handle a valid first array with undefined and null elements in subsequent arrays", () => {
  expect(difference([1, 2, 3], [undefined], [null])).toEqual([1, 2, 3])
})
