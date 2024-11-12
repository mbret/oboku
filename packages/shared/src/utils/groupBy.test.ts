import { it, expect } from "vitest"
import { groupBy } from "./groupBy" // Adjust the import path as needed

it("should group numbers by Math.floor", () => {
  const result = groupBy([6.1, 4.2, 6.3], Math.floor)
  expect(result).toEqual({ "4": [4.2], "6": [6.1, 6.3] })
})

it("should group strings by length", () => {
  const result = groupBy(["one", "two", "three"], (x) => x.length)
  expect(result).toEqual({ "3": ["one", "two"], "5": ["three"] })
})

it("should handle collection with null or undefined elements", () => {
  const result = groupBy([1, 2, null, 3, undefined], (x) =>
    x === null ? "null" : x === undefined ? "undefined" : x
  )
  expect(result).toEqual({
    "1": [1],
    "2": [2],
    "3": [3],
    null: [null],
    undefined: [undefined]
  })
})

it("should return an empty object if the collection is null or undefined", () => {
  expect(groupBy(null, Math.floor)).toEqual({})
  expect(groupBy(undefined, () => ``)).toEqual({})
})

it("should handle an empty collection", () => {
  expect(groupBy([], () => ``)).toEqual({})
})

it("should use the default iteratee (String conversion) when none is provided", () => {
  const result = groupBy([1, "1", 2, "2", 3])
  expect(result).toEqual({ "1": [1, "1"], "2": [2, "2"], "3": [3] })
})

it("should group objects by a property value using a string as iteratee", () => {
  const items = [
    { id: 1, linkResourceId: "A" },
    { id: 2, linkResourceId: "B" },
    { id: 3, linkResourceId: "A" }
  ]
  const result = groupBy(items, "linkResourceId")
  expect(result).toEqual({
    A: [
      { id: 1, linkResourceId: "A" },
      { id: 3, linkResourceId: "A" }
    ],
    B: [{ id: 2, linkResourceId: "B" }]
  })
})

it("should group objects by a property name dynamically", () => {
  const users = [
    { id: 1, role: "admin" },
    { id: 2, role: "user" },
    { id: 3, role: "admin" },
    { id: 4, role: "user" }
  ]
  const result = groupBy(users, "role")
  expect(result).toEqual({
    admin: [
      { id: 1, role: "admin" },
      { id: 3, role: "admin" }
    ],
    user: [
      { id: 2, role: "user" },
      { id: 4, role: "user" }
    ]
  })
})

it("should handle arrays with mixed types correctly", () => {
  const result = groupBy([1, "one", 2, "two", true, false], (x) => typeof x)
  expect(result).toEqual({
    number: [1, 2],
    string: ["one", "two"],
    boolean: [true, false]
  })
})

it("should group using a complex iteratee function", () => {
  const result = groupBy(["apple", "banana", "pear"], (x) => x[0] ?? ``)
  expect(result).toEqual({
    a: ["apple"],
    b: ["banana"],
    p: ["pear"]
  })
})

it("should group objects correctly by multiple criteria", () => {
  const objects = [
    { a: 1, b: 2 },
    { a: 1, b: 3 },
    { a: 2, b: 2 }
  ]
  const result = groupBy(objects, (obj) => `${obj.a}-${obj.b}`)
  expect(result).toEqual({
    "1-2": [{ a: 1, b: 2 }],
    "1-3": [{ a: 1, b: 3 }],
    "2-2": [{ a: 2, b: 2 }]
  })
})
