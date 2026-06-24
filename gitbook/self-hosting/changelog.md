# Changelog

This page lists changes that require action when upgrading a self-hosted instance. Only releases with migration steps are listed.

## 1.2.0

CouchDB is now reached **through the API** under the `/couchdb` route instead of being exposed directly. The standalone CouchDB reverse-proxy container is gone, and CouchDB no longer needs any published ports.

Steps to upgrade:

1. **Pull and recreate, removing the old proxy container.** The previous `couchdb-proxy` service no longer exists, so remove it as an orphan:

   ```bash
   docker compose pull
   docker compose up -d --remove-orphans
   ```

2. **Stop publishing CouchDB ports.** If your compose file published CouchDB (ports `5984`–`5987`), remove those mappings — CouchDB is now internal-only and reached via the API. Use the default [docker-compose.yml](../../docker-compose.yml) as reference.

3. **Set `COUCH_DB_URL` if CouchDB runs elsewhere.** When CouchDB is not the bundled container (e.g. it lives on another server), point the API at it:

   ```bash
   COUCH_DB_URL=http://your-couchdb-host:5984
   ```

   It defaults to the bundled `http://couchdb:5984`, so you can leave it unset for the standard setup.

4. **Rename the alternate origin variables.** `VITE_COUCH_DB_PUBLIC_URL`, `VITE_COUCH_DB_PUBLIC_URL_2/3/4` are replaced by `VITE_API_URL_2`, `VITE_API_URL_3`, `VITE_API_URL_4`. These are now extra API origins (replication runs against the API), used only to work around the browser's per-origin HTTP/1 connection limit. See [environment-variables.md](configuration/environment-variables.md "mention").

5. **Prefer HTTP/2 in front of the API.** If you serve the API behind an HTTP/2 reverse proxy, a single origin handles all replication and you can leave `VITE_API_URL_2/3/4` unset. Without HTTP/2 you must provide those extra origins. See [installation.md](installation.md "mention").
