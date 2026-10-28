import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import { ObokuErrorCode } from "@oboku/shared"
import { humanId } from "human-id"
import { InstanceConfigService } from "../admin/instance-config/instance-config.service.js"
import { generateEReaderPassword } from "../crypto/eReaderPassword.js"
import { hashSecret } from "../crypto/secretHash.js"
import { OpdsServerPostgresService } from "../features/postgres/opds-server-postgres.service.js"

const SLUG_ATTEMPTS = 5

/** Such as `calm-snails-dream`, named `Calm snails dream`. */
const generateSlugAndName = () => {
  const slug = humanId({ separator: "-", capitalize: false })
  const words = slug.replaceAll("-", " ")

  return { slug, name: `${words.charAt(0).toUpperCase()}${words.slice(1)}` }
}

const createServerNotFoundError = () =>
  new NotFoundException("OPDS server not found")

@Injectable()
export class OpdsServersService {
  constructor(
    private readonly opdsServerPostgresService: OpdsServerPostgresService,
    private readonly instanceConfigService: InstanceConfigService,
  ) {}

  list(userId: number) {
    return this.opdsServerPostgresService.findByUserId(userId)
  }

  async create(userId: number) {
    const { opdsServersMaxPerUser } =
      this.instanceConfigService.getConfig().value
    const serverCount =
      await this.opdsServerPostgresService.countByUserId(userId)
    const isUnderServerLimit = serverCount < opdsServersMaxPerUser

    if (!isUnderServerLimit) {
      throw new BadRequestException({
        errors: [{ code: ObokuErrorCode.ERROR_OPDS_SERVER_LIMIT_REACHED }],
      })
    }

    const password = generateEReaderPassword()
    const server = await this.insertWithFreeSlug({
      userId,
      passwordHash: hashSecret(password),
    })

    return { server, password }
  }

  async rename({
    userId,
    id,
    name,
  }: {
    userId: number
    id: number
    name: string
  }) {
    const server = await this.opdsServerPostgresService.rename({
      userId,
      id,
      name,
    })

    if (!server) throw createServerNotFoundError()

    return server
  }

  async regeneratePassword({ userId, id }: { userId: number; id: number }) {
    const password = generateEReaderPassword()
    const server = await this.opdsServerPostgresService.replacePasswordHash({
      userId,
      id,
      passwordHash: hashSecret(password),
    })

    if (!server) throw createServerNotFoundError()

    return { server, password }
  }

  async delete({ userId, id }: { userId: number; id: number }) {
    const isDeleted = await this.opdsServerPostgresService.delete({
      userId,
      id,
    })

    if (!isDeleted) throw createServerNotFoundError()
  }

  private async insertWithFreeSlug({
    userId,
    passwordHash,
  }: {
    userId: number
    passwordHash: string
  }) {
    for (let attempt = 1; attempt <= SLUG_ATTEMPTS; attempt++) {
      const server = await this.opdsServerPostgresService.insertUnlessSlugTaken(
        {
          userId,
          passwordHash,
          ...generateSlugAndName(),
        },
      )

      if (server) return server
    }

    throw new Error(`No free OPDS server slug after ${SLUG_ATTEMPTS} attempts`)
  }
}
