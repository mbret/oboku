import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { OpdsServerPostgresEntity } from "./entities.js"

type UserOpdsServer = { userId: number; id: number }

@Injectable()
export class OpdsServerPostgresService {
  constructor(
    @InjectRepository(OpdsServerPostgresEntity)
    private readonly serverRepository: Repository<OpdsServerPostgresEntity>,
  ) {}

  findByUserId(userId: number) {
    return this.serverRepository.find({
      where: { user_id: userId },
      order: { id: "ASC" },
    })
  }

  /**
   * @returns `null` when another server already has `slug`. The insert skips
   * any conflict, and the slug index is the only one it can hit.
   */
  async insertUnlessSlugTaken({
    userId,
    slug,
    name,
    passwordHash,
  }: {
    userId: number
    slug: string
    name: string
    passwordHash: string
  }) {
    const inserted = await this.serverRepository
      .createQueryBuilder()
      .insert()
      .values({
        user_id: userId,
        slug,
        name,
        password_hash: passwordHash,
        created_at: new Date(),
      })
      .orIgnore()
      .returning("*")
      .execute()

    // TypeORM types InsertResult.raw as `any` since its shape depends on the
    // driver; `.returning("*")` makes Postgres return the inserted row, and no
    // row when the slug conflict skipped the insert.
    return (inserted.raw[0] as OpdsServerPostgresEntity | undefined) ?? null
  }

  /** @returns `null` when the user has no such server. */
  async update({
    userId,
    id,
    changes,
  }: UserOpdsServer & {
    changes: Partial<Pick<OpdsServerPostgresEntity, "name" | "password_hash">>
  }) {
    const { affected } = await this.serverRepository.update(
      { id, user_id: userId },
      changes,
    )

    return affected ? this.serverRepository.findOneBy({ id }) : null
  }

  /** @returns `false` when the user has no such server. */
  async delete({ userId, id }: UserOpdsServer) {
    const { affected } = await this.serverRepository.delete({
      id,
      user_id: userId,
    })

    return Boolean(affected)
  }

  async deleteByUserId(userId: number) {
    await this.serverRepository.delete({ user_id: userId })
  }
}
