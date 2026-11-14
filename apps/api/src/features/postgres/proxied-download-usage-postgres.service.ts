import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { ProxiedDownloadUsagePostgresEntity } from "./entities.js"

export type ProxiedDownloadReservationResult = "reserved" | "quota-reached"

@Injectable()
export class ProxiedDownloadUsagePostgresService {
  constructor(
    @InjectRepository(ProxiedDownloadUsagePostgresEntity)
    private readonly usageRepository: Repository<ProxiedDownloadUsagePostgresEntity>,
  ) {}

  /**
   * Adds `bytes` to the month's counter unless that would pass `quotaBytes`.
   * A reservation of no bytes, for a file of unknown size, fits only below
   * the quota. Postgres checks the condition again on the row a concurrent
   * update left, so each reservation counts the bytes the others added.
   *
   * @param month the first day of the month, UTC, as `YYYY-MM-DD`.
   */
  async reserveWithinQuota({
    month,
    bytes,
    quotaBytes,
  }: {
    month: string
    bytes: number
    quotaBytes: number
  }): Promise<ProxiedDownloadReservationResult> {
    await this.usageRepository
      .createQueryBuilder()
      .insert()
      .values({ month, bytes: 0 })
      .orIgnore()
      .execute()

    const { affected } = await this.usageRepository
      .createQueryBuilder()
      .update()
      .set({ bytes: () => "bytes + :bytes" })
      .where("month = :month")
      .andWhere("bytes < :quotaBytes")
      .andWhere("bytes + :bytes <= :quotaBytes")
      .setParameters({ month, bytes, quotaBytes })
      .execute()
    const isReserved = affected === 1

    return isReserved ? "reserved" : "quota-reached"
  }

  /**
   * Adds `bytes` to the month's counter: negative to give reserved bytes
   * back.
   */
  async adjust({ month, bytes }: { month: string; bytes: number }) {
    await this.usageRepository.increment({ month }, "bytes", bytes)
  }
}
