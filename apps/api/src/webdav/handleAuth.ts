import type { Request, Response } from "express"
import { createHash, timingSafeEqual } from "node:crypto"
import bcrypt from "bcrypt"
import type { InstanceConfigService } from "src/admin/instance-config/instance-config.service"

function timingSafeStringEqual(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest()
  const hashB = createHash("sha256").update(b).digest()

  return timingSafeEqual(hashA, hashB)
}

function sendUnauthorized(res: Response) {
  res.status(401).set("WWW-Authenticate", 'Basic realm="oboku-webdav"').end()
}

/**
 * Validates HTTP Basic Auth against the credentials stored in the
 * instance config. Returns `true` when authenticated, or `false`
 * after sending a 401 response.
 */
export async function handleAuth(
  req: Request,
  res: Response,
  instanceConfigService: InstanceConfigService,
): Promise<boolean> {
  const credentials = await instanceConfigService.getWebDavCredentials()

  if (!credentials) {
    sendUnauthorized(res)

    return false
  }

  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith("Basic ")) {
    sendUnauthorized(res)

    return false
  }

  const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf8")
  const separatorIndex = decoded.indexOf(":")

  if (separatorIndex === -1) {
    sendUnauthorized(res)

    return false
  }

  const username = decoded.slice(0, separatorIndex)
  const password = decoded.slice(separatorIndex + 1)

  const passwordMatch = await bcrypt.compare(password, credentials.password)

  if (
    !timingSafeStringEqual(username, credentials.username) ||
    !passwordMatch
  ) {
    sendUnauthorized(res)

    return false
  }

  return true
}
