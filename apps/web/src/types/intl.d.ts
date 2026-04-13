declare namespace Intl {
  // TypeScript 5.9.x in this repo does not yet ship Intl.DurationFormat in its
  // bundled lib typings, even though our supported browsers expose it at
  // runtime.
  //
  // TODO: Remove this shim after upgrading TypeScript to a version that
  // includes microsoft/TypeScript#63046 (TypeScript 6.0+).
  interface DurationFormatOptions {
    style?: "long" | "short" | "narrow" | "digital"
  }

  interface DurationInput {
    years?: number
    months?: number
    weeks?: number
    days?: number
    hours?: number
    minutes?: number
    seconds?: number
    milliseconds?: number
    microseconds?: number
    nanoseconds?: number
  }

  class DurationFormat {
    constructor(
      locales?: string | string[] | Locale,
      options?: DurationFormatOptions,
    )

    format(duration: DurationInput): string
  }
}
