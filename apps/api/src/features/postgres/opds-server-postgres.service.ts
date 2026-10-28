import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { EntityManager, Repository } from "typeorm"
import { OpdsServerPostgresEntity, UserPostgresEntity } from "./entities.js"

type UserOpdsServer = { userId: number; id: number }

type SlugCandidate = { slug: string; name: string }

export type OpdsServerInsertResult =
  | { status: "created"; server: OpdsServerPostgresEntity }
  | { status: "user-missing" }
  | { status: "limit-reached" }
  | { status: "slugs-taken" }

/**
 * @returns `null` when another server already has `slug`. The insert skips
 * any conflict, and the slug index is the only one it can hit.
 */
const insertUnlessSlugTaken = async (
  manager: EntityManager,
  {
    userId,
    passwordHash,
    slug,
    name,
  }: SlugCandidate & { userId: number; passwordHash: string },
) => {
  const inserted = await manager
    .createQueryBuilder()
    .insert()
    .into(OpdsServerPostgresEntity)
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

  // `InsertResult.raw` is `any`. With `.returning("*")`, Postgres returns the
  // inserted row, or none when the insert was skipped.
  return (inserted.raw[0] as OpdsServerPostgresEntity | undefined) ?? null
}

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
   * Inserts a server unless the user already has `maxServers`, under the
   * first slug of `candidates` no other server has. A lock on the user's row
   * makes concurrent inserts for one user wait for each other, so each counts
   * the servers the others added. A user id with no row, such as a deleted
   * account whose access token is still valid, gets no server.
   */
  insertUnderLimit({
    userId,
    maxServers,
    passwordHash,
    candidates,
  }: {
    userId: number
    maxServers: number
    passwordHash: string
    candidates: SlugCandidate[]
  }) {
    return this.serverRepository.manager.transaction(
      async function insertWhileUserIsLocked(
        manager,
      ): Promise<OpdsServerInsertResult> {
        const user = await manager.findOne(UserPostgresEntity, {
          where: { id: userId },
          lock: { mode: "pessimistic_write" },
        })

        if (!user) return { status: "user-missing" }

        const serverCount = await manager.count(OpdsServerPostgresEntity, {
          where: { user_id: userId },
        })
        const isUnderLimit = serverCount < maxServers

        if (!isUnderLimit) return { status: "limit-reached" }

        for (const candidate of candidates) {
          const server = await insertUnlessSlugTaken(manager, {
            userId,
            passwordHash,
            ...candidate,
          })

          if (server) return { status: "created", server }
        }

        return { status: "slugs-taken" }
      },
    )
  }

  /** @returns `null` when the user has no such server. */
  rename({ userId, id, name }: UserOpdsServer & { name: string }) {
    return this.updateUserServer({ userId, id }, { name })
  }

  /** @returns `null` when the user has no such server. */
  replacePasswordHash({
    userId,
    id,
    passwordHash,
  }: UserOpdsServer & { passwordHash: string }) {
    return this.updateUserServer(
      { userId, id },
      { password_hash: passwordHash },
    )
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

  private async updateUserServer(
    { userId, id }: UserOpdsServer,
    changes: Partial<Pick<OpdsServerPostgresEntity, "name" | "password_hash">>,
  ) {
    const { affected } = await this.serverRepository.update(
      { id, user_id: userId },
      changes,
    )

    return affected ? this.serverRepository.findOneBy({ id }) : null
  }
}
