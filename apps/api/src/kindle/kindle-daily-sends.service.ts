import { Injectable } from "@nestjs/common"

export const KINDLE_MAX_SENDS_PER_USER_PER_DAY = 10

const toUtcDay = (date: Date) => date.toISOString().slice(0, 10)

/**
 * Counts the sends of each user in the current UTC day. The counts live in
 * memory: a restart of the API starts the day again.
 */
@Injectable()
export class KindleDailySendsService {
  private countedDay = toUtcDay(new Date())
  private sendsByUserId = new Map<number, number>()

  /** Counts one more send for the user, unless the day's sends are all used. */
  reserve(userId: number): "reserved" | "limit-reached" {
    const sends = this.readTodaySends().get(userId) ?? 0

    if (sends >= KINDLE_MAX_SENDS_PER_USER_PER_DAY) return "limit-reached"

    this.sendsByUserId.set(userId, sends + 1)

    return "reserved"
  }

  /** Gives back a send that `reserve` counted, for one that failed. */
  release(userId: number) {
    const todaySends = this.readTodaySends()
    const sends = todaySends.get(userId)

    if (sends === undefined) return

    todaySends.set(userId, sends - 1)
  }

  private readTodaySends() {
    const today = toUtcDay(new Date())
    const isCountedDayOver = today !== this.countedDay

    if (isCountedDayOver) {
      this.countedDay = today
      this.sendsByUserId = new Map()
    }

    return this.sendsByUserId
  }
}
