import { Injectable, Logger } from "@nestjs/common"
import * as httpProxy from "http-proxy-3"
import http from "node:http"
import type { Request, Response } from "express"
import { AppConfigService } from "../config/AppConfigService"

/**
 * Reverse proxy that exposes CouchDB under the API's `/couchdb` route.
 *
 * CouchDB itself stays internal-only (`COUCH_DB_URL`, defaulting to the bundled
 * `couchdb:5984`, but it may live on another server). Routing sync traffic
 * through the API centralizes auth and means deployers expose a single port.
 *
 * Behaviour mirrors the official CouchDB nginx example: a transparent
 * passthrough that streams bodies (http-proxy-3 does not buffer) and leaves
 * redirects alone. CouchDB performs the actual auth (it validates the Bearer
 * JWT) and emits CORS headers, so this layer just forwards.
 *
 * The browser per-origin connection limit (which live replication of several
 * collections would otherwise hit over HTTP/1) is handled at the edge, not
 * here: in production by the deployer's HTTP/2 reverse proxy, in dev by the
 * couchdb-proxy service that fans this route out across a few ports.
 */
@Injectable()
export class CouchProxyService {
  private readonly logger = new Logger(CouchProxyService.name)
  private proxy: httpProxy.ProxyServer | undefined

  constructor(private readonly appConfigService: AppConfigService) {}

  private getProxy() {
    if (this.proxy) return this.proxy

    const proxy = httpProxy.createProxyServer({
      target: this.appConfigService.COUCH_DB_URL,
    })

    proxy.on("proxyReq", (proxyReq, req) => {
      const remoteAddr = req.socket.remoteAddress ?? ""
      const existingForwardedFor = req.headers["x-forwarded-for"]
      const forwardedFor = existingForwardedFor
        ? `${existingForwardedFor}, ${remoteAddr}`
        : remoteAddr
      // Preserve the original scheme so CouchDB builds https absolute URLs when
      // a TLS-terminating proxy sits in front of the API; fall back to this
      // hop's scheme otherwise.
      const forwardedProto =
        (req.headers["x-forwarded-proto"] as string | undefined) ??
        ("encrypted" in req.socket && req.socket.encrypted ? "https" : "http")

      proxyReq.setHeader("X-Forwarded-For", forwardedFor)
      proxyReq.setHeader("X-Forwarded-Proto", forwardedProto)
    })

    proxy.on("error", (error, _req, res) => {
      this.logger.error("CouchDB proxy error", error)

      if (res instanceof http.ServerResponse) {
        if (!res.headersSent) {
          res.writeHead(502)
        }
        res.end()
      } else {
        // The errored target was a raw socket (e.g. an upgrade); just close it.
        res.destroy()
      }
    })

    this.proxy = proxy

    return proxy
  }

  /**
   * Express middleware. Mounted at `/couchdb` (the mount path is stripped from
   * `req.url`), so requests forward to CouchDB at the root, e.g.
   * `/couchdb/userdb-x/_changes` -> `<COUCH_DB_URL>/userdb-x/_changes`.
   */
  middleware = (req: Request, res: Response) => {
    this.getProxy().web(req, res)
  }
}
