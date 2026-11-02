import type { Request, Response } from "express"
import bcrypt from "bcrypt"
import type { InstanceConfigService } from "../admin/instance-config/instance-config.service.js"
import { timingSafeStringEqual } from "../crypto/timingSafeStringEqual.js"
import { parseBasicAuthorization } from "../http/basicAuthorization.js"

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
  const { credentials } = instanceConfigService.getConfig().value.serverSync

  if (!credentials) {
    sendUnauthorized(res)

    return false
  }

  const presentedCredentials = parseBasicAuthorization(
    req.headers.authorization,
  )

  if (!presentedCredentials) {
    sendUnauthorized(res)

    return false
  }

  const passwordMatch = await bcrypt.compare(
    presentedCredentials.password,
    credentials.password,
  )

  if (
    !timingSafeStringEqual(
      presentedCredentials.username,
      credentials.username,
    ) ||
    !passwordMatch
  ) {
    sendUnauthorized(res)

    return false
  }

  return true
}
