import { Injectable, Logger } from "@nestjs/common"
import * as httpProxy from "http-proxy-3"
import http from "node:http"
import type { Request, Response } from "express"
import { AppConfigService } from "../config/AppConfigService"

// CORS is owned by this proxy rather than delegated to CouchDB, so replication
// does not depend on CouchDB's `[cors]` config and we never emit a header
// twice. These values mirror what the bundled CouchDB advertises.
const ALLOWED_METHODS = "GET, HEAD, POST, PUT, DELETE, OPTIONS"
const ALLOWED_HEADERS = "accept, authorization, content-type, origin, referer"
// Headers the browser is allowed to read off responses. PouchDB/RxDB read a few
// of these during replication (e.g. ETag), so expose them explicitly since
// stripping CouchDB's own CORS headers (below) would otherwise hide them.
const EXPOSED_HEADERS =
  "Cache-Control, Content-Type, Content-Range, ETag, Server, X-Couch-Request-ID, X-CouchDB-Body-Time"
const PREFLIGHT_MAX_AGE = "86400"
// CouchDB's CORS headers are stripped from upstream responses so only ours
// survive (duplicate Access-Control-Allow-Origin headers are rejected by
// browsers).
const COUCH_CORS_RESPONSE_HEADERS = [
  "access-control-allow-origin",
  "access-control-allow-credentials",
  "access-control-allow-methods",
  "access-control-allow-headers",
  "access-control-expose-headers",
  "access-control-max-age",
]

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
 * JWT). CORS, however, is owned here (see the constants above) so replication
 * does not depend on CouchDB's own `[cors]` configuration.
 *
 * The browser per-origin connection limit (which live replication of several
 * collections would otherwise hit over HTTP/1) is handled at the edge, not
 * here: in production by the deployer's HTTP/2 reverse proxy, in dev by the
 * dev-proxy service that fans this route out across a few ports.
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
      // Rewrite the upstream Host header to the target host. Otherwise the
      // incoming request's Host (e.g. api.oboku.me) is forwarded as-is, and
      // Node derives the TLS SNI from it. When COUCH_DB_URL points at a
      // name-based reverse proxy (the deployment uses SWAG/nginx), the wrong
      // Host/SNI fails to match the CouchDB server block: it falls back to the
      // default vhost, which serves a self-signed cert (DEPTH_ZERO_SELF_SIGNED_CERT)
      // or its landing page instead of proxying to CouchDB. Sending the target
      // host makes the proxy both present the right cert and route correctly.
      changeOrigin: true,
    })

    proxy.on("proxyReq", (proxyReq, req) => {
      const remoteAddr = req.socket.remoteAddress ?? ""
      const existingForwardedFor = req.headers["x-forwarded-for"]
      const forwardedFor = existingForwardedFor
        ? `${existingForwardedFor}, ${remoteAddr}`
        : remoteAddr
      // Preserve the original scheme so CouchDB builds https absolute URLs when
      // a TLS-terminating proxy sits in front of the API; fall back to this
      // hop's scheme otherwise. A repeated header arrives as an array, so take
      // the first (outermost) value.
      const forwardedProtoHeader = req.headers["x-forwarded-proto"]
      const forwardedProto =
        (Array.isArray(forwardedProtoHeader)
          ? forwardedProtoHeader[0]
          : forwardedProtoHeader) ??
        ("encrypted" in req.socket && req.socket.encrypted ? "https" : "http")

      proxyReq.setHeader("X-Forwarded-For", forwardedFor)
      proxyReq.setHeader("X-Forwarded-Proto", forwardedProto)
    })

    // Strip CouchDB's CORS headers so only the ones we set on the response
    // survive, then advertise which headers the browser may read.
    proxy.on("proxyRes", (proxyRes, _req, res) => {
      for (const header of COUCH_CORS_RESPONSE_HEADERS) {
        delete proxyRes.headers[header]
      }
      res.setHeader("Access-Control-Expose-Headers", EXPOSED_HEADERS)
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
   * Sets the CORS response headers. With credentials enabled the spec forbids a
   * literal `*`, so the request Origin is reflected back (matching how CouchDB
   * behaves with `origins = *` + `credentials = true`); requests without an
   * Origin (same-origin, or non-browser clients) get `*` and no credentials.
   */
  private applyCorsHeaders(req: Request, res: Response) {
    const origin = req.headers.origin

    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin)
      res.setHeader("Access-Control-Allow-Credentials", "true")
      res.setHeader("Vary", "Origin")
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*")
    }
  }

  /**
   * Express middleware. Mounted at `/couchdb` (the mount path is stripped from
   * `req.url`), so requests forward to CouchDB at the root, e.g.
   * `/couchdb/userdb-x/_changes` -> `<COUCH_DB_URL>/userdb-x/_changes`.
   */
  middleware = (req: Request, res: Response) => {
    this.applyCorsHeaders(req, res)

    // Answer the CORS preflight ourselves instead of forwarding it, so it works
    // even when CouchDB is momentarily unreachable.
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Methods", ALLOWED_METHODS)
      res.setHeader("Access-Control-Allow-Headers", ALLOWED_HEADERS)
      res.setHeader("Access-Control-Max-Age", PREFLIGHT_MAX_AGE)
      res.writeHead(204)
      res.end()

      return
    }

    this.getProxy().web(req, res)
  }
}
