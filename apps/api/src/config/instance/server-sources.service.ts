import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import fs from "node:fs"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { type ServerSourceConfig } from "src/config/instance/instance-config.service"

type CreateServerSourceInput = {
  name: string
  path: string
  enabled?: boolean
}

type UpdateServerSourceInput = {
  name?: string
  path?: string
  enabled?: boolean
}

export type PublicServerSource = Pick<ServerSourceConfig, "id" | "name">

type CreateServerSourceParams = {
  sources: ServerSourceConfig[]
  input: CreateServerSourceInput
}

type UpdateServerSourceParams = {
  sources: ServerSourceConfig[]
  id: string
  input: UpdateServerSourceInput
}

@Injectable()
export class ServerSourcesService {
  list(sources: ServerSourceConfig[]): ServerSourceConfig[] {
    return sources
  }

  listEnabled(sources: ServerSourceConfig[]): PublicServerSource[] {
    return sources
      .filter((source) => source.enabled)
      .map(({ id, name }) => ({ id, name }))
  }

  async create({ sources, input }: CreateServerSourceParams): Promise<{
    source: ServerSourceConfig
    sources: ServerSourceConfig[]
  }> {
    const name = this.normalizeName(input.name)
    const normalizedPath = await this.normalizeAndValidatePath(input.path)
    const enabled = input.enabled ?? true

    const nextSource: ServerSourceConfig = {
      id: randomUUID(),
      name,
      path: normalizedPath,
      enabled,
    }

    this.assertPathAvailable(sources, normalizedPath)

    return {
      source: nextSource,
      sources: [...sources, nextSource],
    }
  }

  async update(params: UpdateServerSourceParams): Promise<{
    source: ServerSourceConfig
    sources: ServerSourceConfig[]
  }> {
    const { id, input, sources } = params
    const existingSource = sources.find((source) => source.id === id)

    if (!existingSource) {
      throw new NotFoundException("Server source not found")
    }

    const nextName =
      input.name !== undefined
        ? this.normalizeName(input.name)
        : existingSource.name
    const nextPath =
      input.path !== undefined
        ? await this.normalizeAndValidatePath(input.path)
        : existingSource.path
    const nextEnabled = input.enabled ?? existingSource.enabled

    const nextSource: ServerSourceConfig = {
      ...existingSource,
      name: nextName,
      path: nextPath,
      enabled: nextEnabled,
    }

    this.assertPathAvailable(
      sources.filter((source) => source.id !== id),
      nextPath,
    )

    return {
      source: nextSource,
      sources: sources.map((source) =>
        source.id === id ? nextSource : source,
      ),
    }
  }

  remove(id: string, sources: ServerSourceConfig[]): ServerSourceConfig[] {
    const sourceExists = sources.some((source) => source.id === id)

    if (!sourceExists) {
      throw new NotFoundException("Server source not found")
    }

    return sources.filter((source) => source.id !== id)
  }

  private normalizeName(value: string): string {
    const name = value.trim()

    if (name.length < 1) {
      throw new BadRequestException("Server source name is required")
    }

    return name
  }

  private async normalizeAndValidatePath(value: string): Promise<string> {
    const candidatePath = value.trim()

    if (candidatePath.length < 1) {
      throw new BadRequestException("Server source path is required")
    }

    if (!path.isAbsolute(candidatePath)) {
      throw new BadRequestException("Server source path must be absolute")
    }

    const normalizedPath = path.resolve(path.normalize(candidatePath))

    let stats: fs.Stats

    try {
      stats = await fs.promises.stat(normalizedPath)
    } catch (error) {
      throw new BadRequestException(
        `Server source path does not exist: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      )
    }

    if (!stats.isDirectory()) {
      throw new BadRequestException("Server source path must be a directory")
    }

    try {
      await fs.promises.access(normalizedPath, fs.constants.R_OK)
    } catch (error) {
      throw new BadRequestException(
        `Server source path is not readable: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      )
    }

    return normalizedPath
  }

  private assertPathAvailable(
    sources: ServerSourceConfig[],
    candidatePath: string,
  ) {
    const duplicatePath = sources.find(
      (source) => source.path === candidatePath,
    )

    if (duplicatePath) {
      throw new ConflictException("A server source already uses this path")
    }
  }
}
