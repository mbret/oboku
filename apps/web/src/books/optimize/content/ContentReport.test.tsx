// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ContentReport } from "./ContentReport"

const mocks = vi.hoisted(function createMocks() {
  return { useBookOptimize: vi.fn() }
})

vi.mock("../BookOptimizeProvider", function mockBookOptimizeProvider() {
  return { useBookOptimize: mocks.useBookOptimize }
})

describe("ContentReport", function testContentReport() {
  afterEach(function cleanUpContentReport() {
    cleanup()
    vi.clearAllMocks()
  })

  it("shows the average image aspect ratio", function showAverageImageAspectRatio() {
    mocks.useBookOptimize.mockReturnValue({
      inspection: {
        averageImageResolution: { width: 2143, height: 3056 },
        fileCount: 396,
        fileExtensions: ["JPG"],
        fileSize: 914_700_000,
        imageBytes: 926_200_000,
        imageCount: 396,
      },
    })

    render(<ContentReport />)

    expect(screen.getByText("2143 × 3056 px (0.70:1)")).not.toBeNull()
  })
})
