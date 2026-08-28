// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useForm } from "react-hook-form"
import {
  EMPTY_BOOK_OPTIMIZE_FORM_VALUES,
  type BookOptimizeFormValues,
} from "../form"
import { MetadataWarnings } from "./MetadataWarnings"
import type { MetadataIdentifierFormValue } from "./formValues"

const mocks = vi.hoisted(function createMocks() {
  return { useBookOptimize: vi.fn() }
})

vi.mock("../BookOptimizeProvider", function mockBookOptimizeProvider() {
  return { useBookOptimize: mocks.useBookOptimize }
})

const inspectionWithoutOpf = {
  resolvedArchive: { unreadableSources: [], sources: {} },
}

function MetadataWarningsHarness({
  identifiers,
}: {
  identifiers: MetadataIdentifierFormValue[]
}) {
  const { control } = useForm<BookOptimizeFormValues>({
    defaultValues: { ...EMPTY_BOOK_OPTIMIZE_FORM_VALUES, identifiers },
  })

  mocks.useBookOptimize.mockReturnValue({
    control,
    inspection: inspectionWithoutOpf,
  })

  return <MetadataWarnings />
}

const identifier = (
  scheme: string,
  value: string,
): MetadataIdentifierFormValue => ({ scheme, value, unique: false })

describe("MetadataWarnings", function testMetadataWarnings() {
  afterEach(function cleanUpMetadataWarnings() {
    cleanup()
    vi.clearAllMocks()
  })

  it("names the identifier a book with no OPF cannot store", function warnUnstorable() {
    render(
      <MetadataWarningsHarness
        identifiers={[identifier("AcmeCatalog", "acme-42")]}
      />,
    )

    expect(
      screen.getByText(/has no field left for AcmeCatalog acme-42/),
    ).not.toBeNull()
  })

  it("names a second ISBN as dropped, ComicInfo having one GTIN field", function warnSecondIsbn() {
    render(
      <MetadataWarningsHarness
        identifiers={[
          identifier("ISBN", "9783161484100"),
          identifier("ISBN", "9780306406157"),
        ]}
      />,
    )

    expect(
      screen.getByText(/has no field left for ISBN 9780306406157/),
    ).not.toBeNull()
  })

  it("stays quiet about a row still being filled in", function ignoreIncompleteRows() {
    render(
      <MetadataWarningsHarness
        identifiers={[identifier("", ""), identifier("AcmeCatalog", "")]}
      />,
    )

    expect(screen.queryByRole("alert")).toBeNull()
  })

  it("stays quiet about schemes ComicInfo can carry", function ignoreStorableSchemes() {
    render(
      <MetadataWarningsHarness
        identifiers={[
          identifier("ISBN", "9783161484100"),
          identifier("GoogleBooks", "zyTCAlFPjgYC"),
          identifier("DOI", "10.1000/182"),
        ]}
      />,
    )

    expect(screen.queryByRole("alert")).toBeNull()
  })
})
