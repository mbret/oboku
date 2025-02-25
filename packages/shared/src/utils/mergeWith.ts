type MergeCustomizer<T> = (
  objValue: T[keyof T] | undefined,
  srcValue: T[keyof T] | undefined,
  key: keyof T,
  object: T,
  source: T,
  stack: any[],
) => T[keyof T] | undefined

function isObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function mergeTwo(
  object: any,
  source: any,
  customizer: MergeCustomizer<any>,
  stack: any[],
): any {
  const merged: any = { ...object }

  for (const key in source) {
    const objValue = object[key]
    const srcValue = source[key]

    const customResult = customizer(
      objValue,
      srcValue,
      key,
      object,
      source,
      stack,
    )

    if (customResult !== undefined) {
      merged[key] = customResult
    } else if (isObject(objValue) && isObject(srcValue)) {
      stack.push([objValue, srcValue])
      merged[key] = mergeTwo(objValue, srcValue, customizer, stack)
      stack.pop()
    } else if (srcValue !== undefined) {
      merged[key] = srcValue
    }
  }

  return merged
}

export function mergeWith<TObject, TSource>(
  object: TObject,
  source: TSource,
  customizer: MergeCustomizer<any>,
): TObject & TSource

export function mergeWith<TObject, TSource1, TSource2>(
  object: TObject,
  source1: TSource1,
  source2: TSource2,
  customizer: MergeCustomizer<any>,
): TObject & TSource1 & TSource2

export function mergeWith<TObject, TSource1, TSource2, TSource3>(
  object: TObject,
  source1: TSource1,
  source2: TSource2,
  source3: TSource3,
  customizer: MergeCustomizer<any>,
): TObject & TSource1 & TSource2 & TSource3

export function mergeWith<TObject, TSource1, TSource2, TSource3, TSource4>(
  object: TObject,
  source1: TSource1,
  source2: TSource2,
  source3: TSource3,
  source4: TSource4,
  customizer: MergeCustomizer<any>,
): TObject & TSource1 & TSource2 & TSource3 & TSource4

export function mergeWith(destination: any, ...sources: any[]): any {
  const stack: any[] = []
  let result = destination
  const customizer = sources[sources.length - 1]

  for (let i = 0; i < sources.length - 1; i++) {
    result = mergeTwo(result, sources[i], customizer, stack)
  }

  return result
}
