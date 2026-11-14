import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { InstanceStreamingUsagePostgresEntity } from "./entities.js"

export type StreamingReservationResult = "reserved" | "cap-reached"

@Injectable()
export class StreamingUsagePostgresService {
  constructor(
    @InjectRepository(InstanceStreamingUsagePostgresEntity)
    private readonly usageRepository: Repository<InstanceStreamingUsagePostgresEntity>,
  ) {}

  /**
   * Adds `bytes` to the month's counter unless that would pass `capBytes`.
   * A reservation of no bytes, for a file of unknown size, fits only below
   * the cap. Postgres checks the condition again on the row a concurrent
   * update left, so each reservation counts the bytes the others added.
   *
   * @param month the first day of the month, UTC, as `YYYY-MM-DD`.
   */
  async reserveUnderCap({
    month,
    bytes,
    capBytes,
  }: {
    month: string
    bytes: number
    capBytes: number
  }): Promise<StreamingReservationResult> {
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
      .andWhere("bytes < :capBytes")
      .andWhere("bytes + :bytes <= :capBytes")
      .setParameters({ month, bytes, capBytes })
      .execute()
    const isReserved = affected === 1

    return isReserved ? "reserved" : "cap-reached"
  }

  /**
   * Adds `bytes` to the month's counter: negative to give reserved bytes
   * back.
   */
  async adjust({ month, bytes }: { month: string; bytes: number }) {
    await this.usageRepository.increment({ month }, "bytes", bytes)
  }
}
