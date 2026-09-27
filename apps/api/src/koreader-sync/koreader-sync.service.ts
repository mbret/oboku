import { Injectable } from "@nestjs/common"
import { UserPostgresService } from "../features/postgres/user-postgres.service"
import {
  type KoreaderSyncProgress,
  KoreaderSyncPostgresService,
} from "../features/postgres/koreader-sync-postgres.service"
import {
  generateSyncPassword,
  hashSyncKey,
  isSyncKeyMatchingHash,
  toSyncKey,
} from "./credentials"

@Injectable()
export class KoreaderSyncService {
  constructor(
    private readonly userPostgresService: UserPostgresService,
    private readonly koreaderSyncPostgresService: KoreaderSyncPostgresService,
  ) {}

  /**
   * The user a sync client signs in as, from its `x-auth-user` (the account
   * email) and `x-auth-key` (the MD5 of the sync password) headers.
   */
  async authorize({
    username,
    key,
  }: {
    username: string
    key: string
  }): Promise<number | undefined> {
    const user = await this.userPostgresService.findByEmail(username)

    if (!user) return undefined

    const credential =
      await this.koreaderSyncPostgresService.findCredentialByUserId(user.id)

    return credential && isSyncKeyMatchingHash(key, credential.key_hash)
      ? user.id
      : undefined
  }

  findCredential(userId: number) {
    return this.koreaderSyncPostgresService.findCredentialByUserId(userId)
  }

  /** Replaces any previous password, which signs devices out. */
  async createPassword(userId: number) {
    const password = generateSyncPassword()

    await this.koreaderSyncPostgresService.saveCredential({
      userId,
      keyHash: hashSyncKey(toSyncKey(password)),
    })

    return password
  }

  /** Signs every device out and forgets the positions they pushed. */
  turnOff(userId: number) {
    return this.koreaderSyncPostgresService.deleteByUserId(userId)
  }

  findProgress(params: { userId: number; document: string }) {
    return this.koreaderSyncPostgresService.findProgress(params)
  }

  saveProgress(progress: KoreaderSyncProgress) {
    return this.koreaderSyncPostgresService.saveProgress(progress)
  }
}
