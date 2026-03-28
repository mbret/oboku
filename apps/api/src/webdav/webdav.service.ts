import { Injectable, Logger } from "@nestjs/common"
import { InstanceConfigService } from "src/admin/instance-config/instance-config.service"
import type { Request, Response } from "express"
import nodePath from "node:path"
import { handlePropfind } from "./handlePropfind"
import { handleGet } from "./handleGet"
import { handleOptions } from "./handleOptions"

/**
 * Read-only WebDAV endpoint that exposes enabled server sources.
 *
 * This endpoint is intentionally public (no authentication) for now so that
 * any WebDAV client on the local network can discover and download files.
 * Authentication may be added in the future.
 */
@Injectable()
export class WebDavService {
  private readonly logger = new Logger(WebDavService.name)

  constructor(private readonly instanceConfigService: InstanceConfigService) {}

  middleware = (req: Request, res: Response) => {
    this.handleRequest(req, res).catch((error: unknown) => {
      this.logger.error("WebDAV request failed", error)

      if (!res.headersSent) {
        res.status(500).end()
      }
    })
  }

  private async handleRequest(req: Request, res: Response) {
    res.set({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS, GET, HEAD, PROPFIND",
      "Access-Control-Allow-Headers": "Content-Type, Depth, Authorization",
    })

    if (
      req.method === "OPTIONS" &&
      req.headers["access-control-request-method"]
    ) {
      res.status(204).end()

      return
    }

    if (!(await this.instanceConfigService.isServerSyncEnabled())) {
      res.status(404).end()

      return
    }

    const method = req.method.toUpperCase()
    const parsed = this.parsePath(req.path)

    if (method === "OPTIONS") {
      handleOptions(res)

      return
    }

    if (method === "PROPFIND" && !parsed) {
      await handlePropfind(req, res, null, this.instanceConfigService)

      return
    }

    if (!parsed) {
      res.status(405).set("Allow", "OPTIONS, PROPFIND").end()

      return
    }

    const { sourceName, relativePath } = parsed

    const source = await this.resolveEnabledSource(sourceName)

    if (!source) {
      res
        .status(404)
        .send(`Server source not found or not enabled: ${sourceName}`)

      return
    }

    const fsPath = this.safeResolveFsPath(source.path, relativePath)

    if (!fsPath) {
      res.status(403).end()

      return
    }

    switch (method) {
      case "PROPFIND":
        await handlePropfind(
          req,
          res,
          { fsPath, sourceName: source.name, sourceRoot: source.path },
          this.instanceConfigService,
        )
        break
      case "GET":
        await handleGet(res, fsPath, false, this.logger)
        break
      case "HEAD":
        await handleGet(res, fsPath, true, this.logger)
        break
      default:
        res.status(405).set("Allow", "OPTIONS, GET, HEAD, PROPFIND").end()
    }
  }

  private parsePath(
    requestPath: string,
  ): { sourceName: string; relativePath: string } | null {
    const segments = requestPath
      .split("/")
      .filter(Boolean)
      .map(decodeURIComponent)

    const sourceName = segments[0]

    if (!sourceName) return null

    return {
      sourceName,
      relativePath: "/" + segments.slice(1).join("/"),
    }
  }

  private async resolveEnabledSource(sourceName: string) {
    const sources = await this.instanceConfigService.getServerSources()

    return sources.find((s) => s.name === sourceName && s.enabled) ?? null
  }

  /**
   * Resolves the filesystem path and rejects anything that escapes
   * the source root (path traversal).
   */
  private safeResolveFsPath(
    sourceRoot: string,
    relativePath: string,
  ): string | null {
    const normalizedRoot = nodePath.resolve(sourceRoot)
    const resolved = nodePath.resolve(
      normalizedRoot,
      relativePath.replace(/^\//, ""),
    )

    if (
      resolved !== normalizedRoot &&
      !resolved.startsWith(normalizedRoot + nodePath.sep)
    ) {
      return null
    }

    return resolved
  }
}
