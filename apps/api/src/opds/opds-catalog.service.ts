import { Injectable } from "@nestjs/common"
import { isSecretMatchingHash } from "../crypto/secretHash.js"
import { OpdsServerPostgresService } from "../features/postgres/opds-server-postgres.service.js"
import {
  normalizeEmail,
  UserPostgresService,
} from "../features/postgres/user-postgres.service.js"

@Injectable()
export class OpdsCatalogService {
  constructor(
    private readonly opdsServerPostgresService: OpdsServerPostgresService,
    private readonly userPostgresService: UserPostgresService,
  ) {}

  /**
   * The server a reader signs in to: `username` is its owner's email, in any
   * case, and `password` the server's own.
   *
   * @returns `undefined` for an unknown slug or wrong credentials alike.
   */
  async authorize({
    slug,
    username,
    password,
  }: {
    slug: string
    username: string
    password: string
  }) {
    const server = await this.opdsServerPostgresService.findBySlug(slug)

    if (!server || !isSecretMatchingHash(password, server.password_hash)) {
      return undefined
    }

    const owner = await this.userPostgresService.findById(server.user_id)
    const isOwnerEmail =
      owner !== null && normalizeEmail(username) === normalizeEmail(owner.email)

    return isOwnerEmail ? server : undefined
  }
}
