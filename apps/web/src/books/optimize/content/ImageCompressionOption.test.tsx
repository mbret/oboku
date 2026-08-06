// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useForm } from "react-hook-form"
import {
  EMPTY_BOOK_OPTIMIZE_FORM_VALUES,
  type BookOptimizeFormValues,
} from "../form"
import { ImageCompressionOption } from "./ImageCompressionOption"

const mocks = vi.hoisted(function createMocks() {
  return {
    useBookOptimize: vi.fn(),
    useIsApplyingLocally: vi.fn(function isNotApplyingLocally() {
      return false
    }),
  }
})

vi.mock("../BookOptimizeProvider", function mockBookOptimizeProvider() {
  return { useBookOptimize: mocks.useBookOptimize }
})

vi.mock("../apply/useApplyLocally", function mockUseApplyLocally() {
  return { useIsApplyingLocally: mocks.useIsApplyingLocally }
})

function ImageCompressionOptionHarness() {
  const { control } = useForm<BookOptimizeFormValues>({
    defaultValues: {
      ...EMPTY_BOOK_OPTIMIZE_FORM_VALUES,
      compressImages: true,
      imageOutputMode: "avif",
    },
  })

  mocks.useBookOptimize.mockReturnValue({
    bookId: "book-id",
    control,
    isUploading: false,
  })

  return <ImageCompressionOption />
}

describe("ImageCompressionOption", function testImageCompressionOption() {
  afterEach(function cleanUpImageCompressionOption() {
    cleanup()
    vi.clearAllMocks()
  })

  it("shows the fixed AVIF encoding recipe", function showAvifRecipe() {
    render(<ImageCompressionOptionHarness />)

    expect(
      screen.getByRole("radio", { name: "Convert to AVIF" }),
    ).toHaveProperty("checked", true)
    expect(screen.getByText("Lossy compression")).not.toBeNull()
    expect(screen.getByText("Quality 50/100")).not.toBeNull()
    expect(screen.getByText("8-bit")).not.toBeNull()
    expect(screen.getByText("YUV 4:2:0")).not.toBeNull()
    expect(
      screen.getByText(/Source colors are normalized to sRGB/),
    ).not.toBeNull()
  })
})
