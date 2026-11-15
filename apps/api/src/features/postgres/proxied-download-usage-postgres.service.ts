import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { EntityManager, Repository } from "typeorm"
import {
  ProxiedDownloadUsagePostgresEntity,
  UserProxiedDownloadUsagePostgresEntity,
} from "./entities.js"

export type ProxiedDownloadReservationResult = "reserved" | "quota-reached"

type MonthlyCounters = {
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
 * Creates the month's counters and locks them. Every transaction that
 * writes both counters takes the instance's first, then the user's, the
 * inserts included, so two of them never wait for each other's.
 */
const lockCounters = async (
  manager: EntityManager,
  { userId, month }: MonthlyCounters,
) => {
  await manager
    .createQueryBuilder()
    .insert()
    .into(ProxiedDownloadUsagePostgresEntity)
    .values({ month, bytes: 0 })
    .orIgnore()
    .execute()
  await manager
    .createQueryBuilder()
    .insert()
    .into(UserProxiedDownloadUsagePostgresEntity)
    .values({ user_id: userId, month, bytes: 0 })
    .orIgnore()
    .execute()

  const usage = await manager.findOneOrFail(
    ProxiedDownloadUsagePostgresEntity,
    { where: { month }, lock: { mode: "pessimistic_write" } },
  )
  const userUsage = await manager.findOneOrFail(
    UserProxiedDownloadUsagePostgresEntity,
    { where: { user_id: userId, month }, lock: { mode: "pessimistic_write" } },
  )

  return { usage, userUsage }
}

/** Adds `bytes` to the month's counters, the instance's first, as `lockCounters` locks them. */
const addToCounters = async (
  manager: EntityManager,
  { userId, month, bytes }: MonthlyCounters & { bytes: number },
) => {
  await manager.increment(
    ProxiedDownloadUsagePostgresEntity,
    { month },
    "bytes",
    bytes,
  )
  await manager.increment(
    UserProxiedDownloadUsagePostgresEntity,
    { user_id: userId, month },
    "bytes",
    bytes,
  )
}

@Injectable()
export class ProxiedDownloadUsagePostgresService {
  constructor(
    @InjectRepository(ProxiedDownloadUsagePostgresEntity)
    private readonly usageRepository: Repository<ProxiedDownloadUsagePostgresEntity>,
    @InjectRepository(UserProxiedDownloadUsagePostgresEntity)
    private readonly userUsageRepository: Repository<UserProxiedDownloadUsagePostgresEntity>,
  ) {}

  /**
   * Adds `bytes` to the month's counters of the instance and of the user,
   * unless either would pass its quota. Concurrent reservations wait for
   * each other's locks, so each counts the bytes the others added.
   */
  reserveWithinQuotas({
    userId,
    month,
    bytes,
    quotaBytes,
    userQuotaBytes,
  }: MonthlyCounters & {
    bytes: number
    quotaBytes: number
    userQuotaBytes: number
  }) {
    return this.usageRepository.manager.transaction(
      async function reserveWhileCountersAreLocked(
        manager,
      ): Promise<ProxiedDownloadReservationResult> {
        const { usage, userUsage } = await lockCounters(manager, {
          userId,
          month,
        })
        const isWithinQuotas =
          fitsWithinQuota({ usedBytes: usage.bytes, bytes, quotaBytes }) &&
          fitsWithinQuota({
            usedBytes: userUsage.bytes,
            bytes,
            quotaBytes: userQuotaBytes,
          })

        if (!isWithinQuotas) return "quota-reached"

        await addToCounters(manager, { userId, month, bytes })

        return "reserved"
      },
    )
  }

  /** @param month the first day of the month, UTC, as `YYYY-MM-DD`. */
  async findBytes(month: string) {
    const usage = await this.usageRepository.findOneBy({ month })

    return usage?.bytes ?? 0
  }

  async findUserBytes({ userId, month }: MonthlyCounters) {
    const userUsage = await this.userUsageRepository.findOneBy({
      user_id: userId,
      month,
    })

    return userUsage?.bytes ?? 0
  }

  /**
   * Adds `bytes` to the month's counters of the instance and of the user:
   * negative to give reserved bytes back.
   */
  adjust(counters: MonthlyCounters & { bytes: number }) {
    return this.usageRepository.manager.transaction(
      function adjustCounters(manager) {
        return addToCounters(manager, counters)
      },
    )
  }

  /** The instance's counters keep the bytes the user's downloads added. */
  async deleteByUserId(userId: number) {
    await this.userUsageRepository.delete({ user_id: userId })
  }
}
