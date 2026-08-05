// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { BehaviorSubject } from "rxjs"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { ApplyLocallyProgress } from "../apply/useApplyLocally"
import type { BookOptimizeFormValues } from "../form"
import { BookOptimizeActionBar } from "./BookOptimizeActionBar"

const mocks = vi.hoisted(function createMocks() {
  return {
    applyLocally: vi.fn(),
    buildUpdateActions: vi.fn(),
    getFileInspectionQueryOptions: vi.fn(),
    getValues: vi.fn(),
    reset: vi.fn(),
    useApplyLocally: vi.fn(),
    useApplyLocallyProgress: vi.fn(),
    useBookOptimize: vi.fn(),
    useIsApplyingLocally: vi.fn(),
  }
})

vi.mock("../BookOptimizeProvider", function mockBookOptimizeProvider() {
  return { useBookOptimize: mocks.useBookOptimize }
})

vi.mock("../apply/useApplyLocally", function mockApplyLocally() {
  return {
    useApplyLocally: mocks.useApplyLocally,
    useApplyLocallyProgress: mocks.useApplyLocallyProgress,
    useIsApplyingLocally: mocks.useIsApplyingLocally,
  }
})

vi.mock("../apply/buildUpdateActions", function mockBuildUpdateActions() {
  return { buildUpdateActions: mocks.buildUpdateActions }
})

vi.mock("../useFileInspection", function mockFileInspection() {
  return {
    getFileInspectionQueryOptions: mocks.getFileInspectionQueryOptions,
  }
})

const INDETERMINATE_PHASE_CASES: [ApplyLocallyProgress, string][] = [
  [{ phase: "preparing" }, "Preparing book…"],
  [{ phase: "rebuilding-book-file" }, "Rebuilding book file…"],
  [{ phase: "saving-locally" }, "Saving locally…"],
  [{ phase: "refreshing-report" }, "Refreshing report…"],
]

const values: BookOptimizeFormValues = {
  compressImages: false,
  imageOutputMode: "webp",
  isbn: "9781234567897",
  maxHeight: "",
  maxWidth: "",
}
const inspection = { fileName: "book.epub" }
const actions = [{ kind: "patch-metadata" }]

function createDeferred<T>() {
  let resolve = function resolveImmediately(_value: T) {}
  const promise = new Promise<T>(function captureResolution(resolvePromise) {
    resolve = resolvePromise
  })

  return { promise, resolve }
}

const renderProgress = (
  progress: ApplyLocallyProgress,
  canApplyLocally = false,
  isApplyingLocally = true,
) => {
  mocks.useBookOptimize.mockReturnValue({
    bookId: "book-id",
    canRevert: false,
    canUpload: false,
    getValues: mocks.getValues,
    isDirty: canApplyLocally,
    isReverting: false,
    isUploading: false,
    isValid: canApplyLocally,
    reset: mocks.reset,
    revertLocalChanges: vi.fn(),
    uploadProgress$: undefined,
    uploadToDataSource: vi.fn(),
  })
  mocks.useApplyLocally.mockReturnValue({ applyLocally: mocks.applyLocally })
  mocks.useApplyLocallyProgress.mockReturnValue(new BehaviorSubject(progress))
  mocks.useIsApplyingLocally.mockReturnValue(isApplyingLocally)

  render(
    <QueryClientProvider client={new QueryClient()}>
      <BookOptimizeActionBar />
    </QueryClientProvider>,
  )
}

describe("BookOptimizeActionBar", function testBookOptimizeActionBar() {
  beforeEach(function prepareApplyCurrentValues() {
    mocks.getValues.mockReturnValue(values)
    mocks.getFileInspectionQueryOptions.mockReturnValue({
      queryKey: ["file-inspection", "book-id"],
      queryFn: async function inspectBook() {
        return inspection
      },
    })
    mocks.buildUpdateActions.mockReturnValue(actions)
    mocks.applyLocally.mockResolvedValue(true)
  })

  afterEach(function cleanUpActionBar() {
    cleanup()
    vi.clearAllMocks()
  })

  it.each(INDETERMINATE_PHASE_CASES)(
    "shows the %s phase",
    function showIndeterminatePhase(progress, expectedLabel) {
      renderProgress(progress)

      expect(screen.getByText(expectedLabel)).not.toBeNull()
      expect(
        screen.getByRole("progressbar").getAttribute("aria-valuenow"),
      ).toBe(null)
    },
  )

  it("shows determinate image optimization progress", function showImageOptimizationProgress() {
    renderProgress({ phase: "optimizing-images", progress: 0.42 })

    expect(screen.getByText("Optimizing images… 42%")).not.toBeNull()
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      "42",
    )
  })

  it("shows indeterminate image optimization before the total is known", function showPendingImageOptimization() {
    renderProgress({ phase: "optimizing-images", progress: undefined })

    expect(screen.getByText("Optimizing images…")).not.toBeNull()
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      null,
    )
  })

  it("applies the current form values and resets the form", async function applyCurrentFormValues() {
    renderProgress({ phase: "rebuilding-book-file" }, true, false)

    fireEvent.click(screen.getByRole("button", { name: "Apply locally" }))

    await waitFor(function waitForAppliedValuesReset() {
      expect(mocks.reset).toHaveBeenCalledWith(values)
    })

    expect(mocks.buildUpdateActions).toHaveBeenCalledWith(values, inspection)
    expect(mocks.applyLocally).toHaveBeenCalledWith({
      actions,
      bookId: "book-id",
    })
    expect(mocks.useApplyLocally).toHaveBeenCalledWith({
      meta: { suppressGlobalErrorToast: true },
    })
  })

  it("does not reset the form when confirmation is declined", async function preserveValuesAfterDeclinedConfirmation() {
    mocks.applyLocally.mockResolvedValue(false)
    renderProgress({ phase: "preparing" }, true, false)

    fireEvent.click(screen.getByRole("button", { name: "Apply locally" }))

    await waitFor(function waitForApplyAttempt() {
      expect(mocks.applyLocally).toHaveBeenCalledOnce()
      expect(screen.getByRole("button", { name: "Apply locally" })).not.toBe(
        null,
      )
    })

    expect(mocks.reset).not.toHaveBeenCalled()
  })

  it("does not show progress while confirmation is pending", async function hideProgressBeforeConfirmation() {
    const confirmation = createDeferred<boolean>()

    mocks.applyLocally.mockReturnValue(confirmation.promise)
    renderProgress({ phase: "preparing" }, true, false)

    fireEvent.click(screen.getByRole("button", { name: "Apply locally" }))

    await waitFor(function waitForConfirmation() {
      expect(mocks.applyLocally).toHaveBeenCalledOnce()
    })

    expect(screen.queryByText("Preparing book…")).toBeNull()
    expect(
      screen
        .getByRole("button", { name: "Apply locally" })
        .hasAttribute("disabled"),
    ).toBe(true)

    await act(async function declineConfirmation() {
      confirmation.resolve(false)
      await confirmation.promise
    })
  })
})
