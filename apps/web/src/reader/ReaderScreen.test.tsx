import { cleanup, render } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router"
import { SIGNAL_RESET } from "reactjrx"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ROUTES } from "../navigation/routes"
import { bookBeingReadStateSignal } from "../reading/states"
import { getReaderPreviewRoute } from "./mode"

const mocks = vi.hoisted(function createReaderScreenMocks() {
  return {
    Reader: vi.fn(function RecordedReader(_props: {
      bookId: string
      usesReadingData: boolean
    }) {
      return null
    }),
  }
})

vi.mock("./Reader", function mockReader() {
  return { Reader: mocks.Reader }
})

vi.mock("./navigation/MoreDialog", function mockMoreDialog() {
  return {
    MoreDialog: function NoMoreDialog() {
      return null
    },
  }
})

import { ReaderScreen } from "./ReaderScreen"

const BOOK_ID = "book-1"

const renderReaderScreen = (route: string) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path={ROUTES.READER} element={<ReaderScreen />} />
      </Routes>
    </MemoryRouter>,
  )

const getReaderProps = () => mocks.Reader.mock.lastCall?.[0]

describe("ReaderScreen", () => {
  beforeEach(function resetBookBeingRead() {
    bookBeingReadStateSignal.update(SIGNAL_RESET)
    mocks.Reader.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  it("opens a reading session, which records the book as being read", () => {
    renderReaderScreen(`/reader/${BOOK_ID}`)

    expect(getReaderProps()).toEqual({ bookId: BOOK_ID, usesReadingData: true })
    expect(bookBeingReadStateSignal.getValue()).toBe(BOOK_ID)
  })

  it("opens a preview, which uses no reading data and records no book as being read", () => {
    renderReaderScreen(getReaderPreviewRoute(BOOK_ID))

    expect(getReaderProps()).toEqual({
      bookId: BOOK_ID,
      usesReadingData: false,
    })
    expect(bookBeingReadStateSignal.getValue()).toBeUndefined()
  })
})
