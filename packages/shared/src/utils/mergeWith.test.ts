import { it, expect } from "vitest"
import { mergeWith } from "./mergeWith" // Adjust the import path as necessary

// Example customizer function for tests
const customizer = (objValue: any, srcValue: any) => {
  if (Array.isArray(objValue)) {
    return objValue.concat(srcValue)
  }

  if (typeof objValue === "number" && typeof srcValue === "number") {
    return objValue + srcValue // custom merge for numbers
  }
}

it("should merge simple objects from source to destination", () => {
  const result = mergeWith(
    { a: 1, b: 2, c: undefined, d: 5 },
    { b: 3, c: 4, d: undefined },
    () => undefined
  )
  expect(result).toEqual({ a: 1, b: 3, c: 4, d: 5 })
})

it("should merge simple objects with customizer", () => {
  const obj1 = { a: 1, b: 2 }
  const obj2 = { b: 3, c: 4 }
  const result = mergeWith(obj1, obj2, customizer)
  expect(result).toEqual({ a: 1, b: 5, c: 4 }) // b: 2 + 3 = 5
})

it("should merge nested objects", () => {
  const obj1 = { a: { x: 1 }, b: 2 }
  const obj2 = { a: { y: 2 }, b: 3 }
  const result = mergeWith(obj1, obj2, customizer)
  expect(result).toEqual({ a: { x: 1, y: 2 }, b: 5 })
})

it("should merge arrays by concatenation", () => {
  const obj1 = { a: [1], b: [2] }
  const obj2 = { a: [3], b: [4] }
  const result = mergeWith(obj1, obj2, customizer)
  expect(result).toEqual({ a: [1, 3], b: [2, 4] })
})

it("should handle custom merge for specific values", () => {
  const obj1 = { a: [1], b: 2 }
  const obj2 = { a: [3], b: 3 }
  const result = mergeWith(obj1, obj2, customizer)
  expect(result).toEqual({ a: [1, 3], b: 5 })
})

it("should handle non-object values correctly", () => {
  const obj1 = { a: 1, b: "hello" }
  const obj2 = { a: 2, b: "world" }
  const result = mergeWith(obj1, obj2, customizer)
  expect(result).toEqual({ a: 3, b: "world" }) // b: overwritten by srcValue
})

it("should handle deep merging with undefined values", () => {
  // @ts-ignore
  const obj = { a: undefined, b: 2 }
  // @ts-ignore
  const source = { a: 3, b: undefined }
  const result = mergeWith(obj, source, () => undefined)
  expect(result).toEqual({ a: 3, b: 2 })
})

it("should handle merging of non-object and object values", () => {
  const obj1 = { a: { x: 1 }, b: 2 }
  const obj2 = { a: 5, b: { y: 3 } }
  const result = mergeWith(obj1, obj2, customizer)
  expect(result).toEqual({ a: 5, b: { y: 3 } }) // non-object overwrites object
})

it("should use customizer to merge dates", () => {
  const customizerDate = (objValue: any, srcValue: any) => {
    if (objValue instanceof Date && srcValue instanceof Date) {
      return new Date(Math.max(objValue.getTime(), srcValue.getTime()))
    }
  }

  const obj1 = { date: new Date("2023-01-01") }
  const obj2 = { date: new Date("2024-01-01") }
  const result = mergeWith(obj1, obj2, customizerDate)
  expect(result).toEqual({ date: new Date("2024-01-01") })
})

it("should merge without a customizer function", () => {
  const obj1 = { a: { x: 1 }, b: [2] }
  const source = { a: { y: 2 }, b: [3] }
  const result = mergeWith(obj1, source, () => undefined) // fallback to default merging
  expect(result).toEqual({ a: { x: 1, y: 2 }, b: [3] }) // last value overwrite
})

it("should merge with an empty object", () => {
  const obj1 = { a: 1, b: 2 }
  const obj2 = {}
  const result = mergeWith(obj1, obj2, customizer)
  expect(result).toEqual({ a: 1, b: 2 })
})

it("should merge into an empty object", () => {
  const obj1 = {}
  const obj2 = { a: 1, b: 2 }
  const result = mergeWith(obj1, obj2, customizer)
  expect(result).toEqual({ a: 1, b: 2 })
})

it("should merge deeply nested objects", () => {
  const obj1 = { a: { b: { c: 1 } } }
  const obj2 = { a: { b: { d: 2 } } }
  const result = mergeWith(obj1, obj2, customizer)
  expect(result).toEqual({ a: { b: { c: 1, d: 2 } } })
})
