import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  KINDLE_MAX_SENDS_PER_USER_PER_DAY,
  KindleDailySendsService,
} from "./kindle-daily-sends.service.js"

const READER_ID = 1
const OTHER_READER_ID = 2

const reserveEverySendOfTheDay = (
  service: KindleDailySendsService,
  userId: number,
) => {
  for (let send = 0; send < KINDLE_MAX_SENDS_PER_USER_PER_DAY; send++) {
    expect(service.reserve(userId)).toBe("reserved")
  }
}

describe("KindleDailySendsService", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-11-28T10:00:00.000Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("refuses a send once the user used the sends of the day", () => {
    const service = new KindleDailySendsService()

    reserveEverySendOfTheDay(service, READER_ID)

    expect(service.reserve(READER_ID)).toBe("limit-reached")
  })

  it("counts each user's sends apart", () => {
    const service = new KindleDailySendsService()

    reserveEverySendOfTheDay(service, READER_ID)

    expect(service.reserve(OTHER_READER_ID)).toBe("reserved")
  })

  it("gives a released send back to its user", () => {
    const service = new KindleDailySendsService()

    reserveEverySendOfTheDay(service, READER_ID)
    service.release(READER_ID)

    expect(service.reserve(READER_ID)).toBe("reserved")
    expect(service.reserve(READER_ID)).toBe("limit-reached")
  })

  it("starts the counts again when the UTC day changes", () => {
    const service = new KindleDailySendsService()

    reserveEverySendOfTheDay(service, READER_ID)
    vi.setSystemTime(new Date("2026-11-28T23:59:59.999Z"))
    expect(service.reserve(READER_ID)).toBe("limit-reached")

    vi.setSystemTime(new Date("2026-11-29T00:00:00.000Z"))

    expect(service.reserve(READER_ID)).toBe("reserved")
  })

  it("does not credit the new day with a send released from the day before", () => {
    const service = new KindleDailySendsService()

    service.reserve(READER_ID)
    vi.setSystemTime(new Date("2026-11-29T00:00:00.000Z"))
    service.release(READER_ID)
    reserveEverySendOfTheDay(service, READER_ID)

    expect(service.reserve(READER_ID)).toBe("limit-reached")
  })
})
