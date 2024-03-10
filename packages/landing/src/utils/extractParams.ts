import { ParsedUrlQuery } from "querystring"

// extract params from a router and validate them against a schema
export const extractParams = <
  Schema extends {
    [index: string]: "string" | "string[]" | "object" | "boolean"
  }
>(
  params: Record<string, unknown> | ParsedUrlQuery | null | undefined,
  schema: Schema
) => {
  return Object.keys(schema).reduce(
    (acc, queryKey) => {
      const queryValue = (params ?? {})[queryKey]

      if (queryValue !== undefined) {
        const validateAs = schema[queryKey]

        if (validateAs === "string")
          return {
            ...acc,
            [queryKey]: typeof queryValue === "string" ? queryValue : undefined
          }

        if (validateAs === "string[]")
          return {
            ...acc,
            [queryKey]: Array.isArray(queryValue) ? queryValue : undefined
          }

        if (validateAs === "object")
          return {
            ...acc,
            [queryKey]: typeof queryValue === "object" ? queryValue : undefined
          }

        if (validateAs === "boolean")
          return {
            ...acc,
            [queryKey]: typeof queryValue === "boolean" ? queryValue : undefined
          }
      }

      return acc
    },
    {} as {
      readonly [Key in keyof Schema]?: Schema[Key] extends "boolean"
        ? boolean
        : Schema[Key] extends "string"
          ? string
          : Schema[Key] extends "string[]"
            ? string[]
            : object
    }
  )
}
