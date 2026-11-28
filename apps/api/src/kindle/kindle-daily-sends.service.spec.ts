import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { KindleDailySendsService } from "./kindle-daily-sends.service.js"

const READER_ID = 1
const OTHER_READER_ID = 2
const MAX_SENDS_PER_DAY = 3

const createService = () =>
  new KindleDailySendsService({
    SEND_TO_KINDLE_MAX_SENDS_PER_DAY: MAX_SENDS_PER_DAY,
  })

const reserveEverySendOfTheDay = (
  service: KindleDailySendsService,
  userId: number,
) => {
  for (let send = 0; send < MAX_SENDS_PER_DAY; send++) {
    expect(service.reserve(userId)).toBeTypeOf("function")
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
    const service = createService()

    reserveEverySendOfTheDay(service, READER_ID)

    expect(service.reserve(READER_ID)).toBeUndefined()
  })

  it("counts each user's sends apart", () => {
    const service = createService()

    reserveEverySendOfTheDay(service, READER_ID)

    expect(service.reserve(OTHER_READER_ID)).toBeTypeOf("function")
  })

  it("gives a send back to its user only", () => {
    const service = createService()
    const giveBackSend = service.reserve(READER_ID)

    service.reserve(READER_ID)
    service.reserve(READER_ID)
    reserveEverySendOfTheDay(service, OTHER_READER_ID)
    giveBackSend?.()

    expect(service.reserve(READER_ID)).toBeTypeOf("function")
    expect(service.reserve(READER_ID)).toBeUndefined()
    expect(service.reserve(OTHER_READER_ID)).toBeUndefined()
  })

  it("starts the counts again when the UTC day changes", () => {
    const service = createService()

    reserveEverySendOfTheDay(service, READER_ID)
    vi.setSystemTime(new Date("2026-11-28T23:59:59.999Z"))
    expect(service.reserve(READER_ID)).toBeUndefined()

    vi.setSystemTime(new Date("2026-11-29T00:00:00.000Z"))

    expect(service.reserve(READER_ID)).toBeTypeOf("function")
  })

  it.each([
    ["has no send yet", 0],
    ["already sent", 1],
  ])(
    "does not credit the new day with a send of the day before, when the user %s in the new day",
    (_case, sendsInNewDay) => {
      const service = createService()
      const giveBackSendOfDayBefore = service.reserve(READER_ID)

      vi.setSystemTime(new Date("2026-11-29T00:00:00.000Z"))

      for (let send = 0; send < sendsInNewDay; send++)
        service.reserve(READER_ID)

      giveBackSendOfDayBefore?.()

      for (let send = sendsInNewDay; send < MAX_SENDS_PER_DAY; send++) {
        expect(service.reserve(READER_ID)).toBeTypeOf("function")
      }

      expect(service.reserve(READER_ID)).toBeUndefined()
    },
  )
})
