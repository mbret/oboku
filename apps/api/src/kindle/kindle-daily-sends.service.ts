import { Inject, Injectable } from "@nestjs/common"
import { AppConfigService } from "../config/AppConfigService.js"

const toUtcDay = (date: Date) => date.toISOString().slice(0, 10)

/**
 * Counts the sends of each user in the current UTC day. The counts live in
 * memory: a restart of the API starts the day again.
 */
@Injectable()
export class KindleDailySendsService {
  private countedDay = toUtcDay(new Date())
  private sendsByUserId = new Map<number, number>()

  constructor(
    @Inject(AppConfigService)
    private readonly appConfigService: Pick<
      AppConfigService,
      "SEND_TO_KINDLE_MAX_SENDS_PER_DAY"
    >,
  ) {}

  /**
   * Counts one more send for the user.
   *
   * @returns how to give the send back when it fails, none once the user
   * used the sends of the day. A send given back after its day ended changes
   * nothing: the new day does not count it.
   */
  reserve(userId: number) {
    const reservedDay = this.startCountingToday()
    const sends = this.sendsByUserId.get(userId) ?? 0

    if (sends >= this.appConfigService.SEND_TO_KINDLE_MAX_SENDS_PER_DAY) {
      return undefined
    }

    this.sendsByUserId.set(userId, sends + 1)

    return () => {
      const isReservedDayStillCounted =
        this.startCountingToday() === reservedDay

      if (!isReservedDayStillCounted) return

      const sendsWithReserved = this.sendsByUserId.get(userId) ?? 1

      this.sendsByUserId.set(userId, sendsWithReserved - 1)
    }
  }

  /** Forgets the counts of a day that ended, and returns the day now counted. */
  private startCountingToday() {
    const today = toUtcDay(new Date())
    const isCountedDayOver = today !== this.countedDay

    if (isCountedDayOver) {
      this.countedDay = today
      this.sendsByUserId = new Map()
    }

    return today
  }
}
