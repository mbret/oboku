import type { Request, Response } from "express"
import fs from "node:fs"
import nodePath from "node:path"
import { lookup } from "mime-types"
import type { InstanceConfigService } from "src/admin/instance-config/instance-config.service"
import { type ResourceInfo, buildMultiStatusXml } from "./webdav.xml"

export type PropfindSource = {
  fsPath: string
  sourceName: string
  sourceRoot: string
}

function toResourceInfo(
  fsPath: string,
  stats: fs.Stats,
  sourceName: string,
  sourceRoot: string,
): ResourceInfo {
  const normalizedRoot = nodePath.resolve(sourceRoot)
  const relative = fsPath.substring(normalizedRoot.length) || "/"
  const normalizedRelative = relative.startsWith("/")
    ? relative
    : "/" + relative

  let href = `/webdav/${sourceName}${normalizedRelative}`

  if (stats.isDirectory() && !href.endsWith("/")) {
    href += "/"
  }

  return {
    href,
    displayName: nodePath.basename(fsPath) || sourceName,
    isDirectory: stats.isDirectory(),
    size: stats.size,
    lastModified: stats.mtime,
    mimeType: stats.isDirectory()
      ? ""
      : lookup(fsPath) || "application/octet-stream",
    etag: stats.isDirectory()
      ? null
      : `"${stats.ino}-${stats.mtimeMs}-${stats.size}"`,
  }
}

export async function handlePropfind(
  req: Request,
  res: Response,
  source: PropfindSource | null,
  instanceConfigService: InstanceConfigService,
) {
  const depth = (req.headers.depth ?? "1") as string
  const resources: ResourceInfo[] = []

  if (!source) {
    const now = new Date()

    resources.push({
      href: "/webdav/",
      displayName: "WebDAV",
      isDirectory: true,
      size: 0,
      lastModified: now,
      mimeType: "",
      etag: null,
    })

    if (depth !== "0") {
      const sources = await instanceConfigService.getServerSources()

      for (const s of sources) {
        if (!s.enabled) continue

        resources.push({
          href: `/webdav/${s.name}/`,
          displayName: s.name,
          isDirectory: true,
          size: 0,
          lastModified: now,
          mimeType: "",
          etag: null,
        })
      }
    }
  } else {
    let stats: fs.Stats

    try {
      stats = await fs.promises.stat(source.fsPath)
    } catch {
      res.status(404).end()

      return
    }

    resources.push(
      toResourceInfo(
        source.fsPath,
        stats,
        source.sourceName,
        source.sourceRoot,
      ),
    )

    if (stats.isDirectory() && depth !== "0") {
      try {
        const entries = await fs.promises.readdir(source.fsPath, {
          withFileTypes: true,
        })

        for (const entry of entries) {
          const childPath = nodePath.join(source.fsPath, entry.name)

          try {
            const childStats = await fs.promises.stat(childPath)
            resources.push(
              toResourceInfo(
                childPath,
                childStats,
                source.sourceName,
                source.sourceRoot,
              ),
            )
          } catch {
            /* skip inaccessible entries */
          }
        }
      } catch {
        /* directory not readable; return just the directory entry */
      }
    }
  }

  res
    .status(207)
    .set("Content-Type", "application/xml; charset=utf-8")
    .send(buildMultiStatusXml(resources))
}
