import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { EntityManager, Repository } from "typeorm"
import { UserProxiedDownloadUsagePostgresEntity } from "./entities.js"

export type ProxiedDownloadReservationResult = "reserved" | "quota-reached"

type UserMonth = {
  userId: number
  /** The first day of the month, UTC, as `YYYY-MM-DD`. */
  month: string
}

/** A reservation of no bytes, for a file of unknown size, fits only below the quota. */
const fitsWithinQuota = ({
  usedBytes,
  bytes,
  quotaBytes,
}: {
  usedBytes: number
  bytes: number
  quotaBytes: number
}) => usedBytes < quotaBytes && usedBytes + bytes <= quotaBytes

/**
 * Makes the month's reservations take turns until the transaction ends, so
 * each one reads a sum that holds the bytes the others added.
 */
const lockMonth = (manager: EntityManager, month: string) =>
  manager.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
    `proxied_download_usage:${month}`,
  ])

const sumMonthBytes = async (manager: EntityManager, month: string) => {
  // `SUM` of a `bigint` is a `numeric`, which node-postgres returns as a string.
  const [{ bytes }]: [{ bytes: string }] = await manager.query(
    "SELECT COALESCE(SUM(bytes), 0) AS bytes FROM user_proxied_download_usage WHERE month = $1",
    [month],
  )

  return Number(bytes)
}

@Injectable()
export class ProxiedDownloadUsagePostgresService {
  constructor(
    @InjectRepository(UserProxiedDownloadUsagePostgresEntity)
    private readonly userUsageRepository: Repository<UserProxiedDownloadUsagePostgresEntity>,
  ) {}

  /**
   * Adds `bytes` to the user's counter for the month, unless the user's or
   * the instance's usage would pass its quota. The instance's usage is the
   * sum of the month's counters.
   */
  reserveWithinQuotas({
    userId,
    month,
    bytes,
    quotaBytes,
    userQuotaBytes,
  }: UserMonth & {
    bytes: number
    quotaBytes: number
    userQuotaBytes: number
  }) {
    return this.userUsageRepository.manager.transaction(
      async function reserveWhileMonthIsLocked(
        manager,
      ): Promise<ProxiedDownloadReservationResult> {
        await lockMonth(manager, month)
        await manager
          .createQueryBuilder()
          .insert()
          .into(UserProxiedDownloadUsagePostgresEntity)
          .values({ user_id: userId, month, bytes: 0 })
          .orIgnore()
          .execute()

        const usedBytes = await sumMonthBytes(manager, month)
        const userUsage = await manager.findOneByOrFail(
          UserProxiedDownloadUsagePostgresEntity,
          { user_id: userId, month },
        )
        const isWithinQuotas =
          fitsWithinQuota({ usedBytes, bytes, quotaBytes }) &&
          fitsWithinQuota({
            usedBytes: userUsage.bytes,
            bytes,
            quotaBytes: userQuotaBytes,
          })

        if (!isWithinQuotas) return "quota-reached"

        await manager.increment(
          UserProxiedDownloadUsagePostgresEntity,
          { user_id: userId, month },
          "bytes",
          bytes,
        )

        return "reserved"
      },
    )
  }

  /** @param month the first day of the month, UTC, as `YYYY-MM-DD`. */
  findBytes(month: string) {
    return sumMonthBytes(this.userUsageRepository.manager, month)
  }

  async findUserBytes({ userId, month }: UserMonth) {
    const userUsage = await this.userUsageRepository.findOneBy({
      user_id: userId,
      month,
    })

    return userUsage?.bytes ?? 0
  }

  /** Adds `bytes` to the user's counter for the month: negative to give reserved bytes back. */
  async adjust({ userId, month, bytes }: UserMonth & { bytes: number }) {
    await this.userUsageRepository.increment(
      { user_id: userId, month },
      "bytes",
      bytes,
    )
  }
}
