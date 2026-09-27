# Preview Environment

The preview environment runs the `develop` branch on a stack of its own, so unreleased work, data migrations included, can be tried without going near production data.

## How it works

Every push to `develop` runs `.github/workflows/deploy-preview.yml`, which builds the api, couchdb, web and admin images and pushes them to Docker Hub as `mbret/oboku-*:preview`. Releases keep `latest` and the version tags, so nothing pulls a preview image unless it asks for the `preview` tag by name.

The preview stack runs those images in Cosmos:

| URL                              | Container             | Port |
| -------------------------------- | --------------------- | ---- |
| `https://preview.oboku.me`       | `oboku-preview-web`   | 80   |
| `https://preview-api.oboku.me`   | `oboku-preview-api`   | 3000 |
| `https://preview-admin.oboku.me` | `oboku-preview-admin` | 80   |

With auto-update on, Cosmos checks for new `preview` images every 6 hours. Update the containers by hand to pick up a push sooner.

The web app and the API share the `oboku.me` site on purpose. The auth cookies are `SameSite=Lax` (see [Authentication](authentication.md)), so the browser only sends them when the page and the API belong to the same site. Vercel preview deployments live on `*.vercel.app`, a public suffix that makes every deployment a site of its own, so they can never sign in against an API we host.

## Keeping production out of reach

The preview stack shares no data, credentials or containers with production. The template below follows these rules; keep them when editing it.

* **Its own secrets volume.** CouchDB generates a new JWT key pair on first start. Never mount production's secrets: the API signs CouchDB admin tokens with that private key, so production's key would give the preview full admin access to production's CouchDB if it could reach it.
* **Explicit database hosts.** `COUCH_DB_URL` and `POSTGRES_HOST` name the preview containers. The API's defaults, `couchdb` and `postgres`, are generic names that could resolve to production containers if the two stacks ever shared a Docker network.
* **New passwords, its own network and volumes, no host ports.** Cosmos routes by hostname, and host ports would clash with production's anyway.
* **No production S3 settings.** Covers stay on the preview's disk, the default `fs` storage. With production's settings they would be written into production's bucket.
* **No `SENTRY_DSN`.** Preview errors would otherwise land in production's Sentry project.
* **A memory budget.** The stack runs on the same server as production. Cap the preview containers' memory in Cosmos when headroom is tight, so a busy preview cannot starve production.

## Setting up the stack in Cosmos

1. Point `preview.oboku.me`, `preview-api.oboku.me` and `preview-admin.oboku.me` at the Cosmos server before creating their URLs, so Cosmos can get their certificates. The names stay one level deep so a `*.oboku.me` wildcard certificate covers them.
2. In ServApps, use **Import Docker Compose** with the template below. Replace the `CHANGE_ME_*` values with new passwords. The Postgres one appears twice and both must match.
3. Create three new URLs from the table above. Give the API URL the same settings as production's API URL (Smart Shield, rate limits), since replication sends many requests.
4. Turn on auto-update for the four `oboku-preview-*` containers running oboku images.
5. Check the API log on start. It should print `Browser origins — app: any port on preview.oboku.me; admin: https://preview-admin.oboku.me`. Any other hostname there means `APP_PUBLIC_URL` or `ADMIN_PUBLIC_URL` is wrong.
6. Create accounts from the preview admin panel, since the template configures no email provider (see [Account Sign in / Sign up](../self-hosting/account-sign-in-sign-up.md)). Adding the `EMAIL_*` variables to the API works too: their links point at `APP_PUBLIC_URL`.

Google, Dropbox and OneDrive stay off, because the template sets none of their client IDs. Register the preview hostnames with those providers before turning them on.

```yaml
services:
  oboku-preview-couchdb:
    image: mbret/oboku-couchdb:preview
    container_name: oboku-preview-couchdb
    restart: always
    environment:
      COUCHDB_USER: admin
      COUCHDB_PASSWORD: CHANGE_ME_COUCHDB
      JWT_PRIVATE_KEY_FILE: /secrets/jwt_private_key.pem
      JWT_PUBLIC_KEY_FILE: /secrets/jwt_public_key.pem
    volumes:
      - oboku-preview-secrets:/secrets
      - oboku-preview-couchdb-data:/opt/couchdb/data
      - oboku-preview-couchdb-config:/opt/couchdb/etc/local.d
    networks:
      - oboku-preview

  oboku-preview-postgres:
    image: postgres:17
    container_name: oboku-preview-postgres
    restart: always
    environment:
      POSTGRES_DB: oboku
      POSTGRES_PASSWORD: CHANGE_ME_POSTGRES
    volumes:
      - oboku-preview-postgres:/var/lib/postgresql/data
    networks:
      - oboku-preview

  oboku-preview-api:
    image: mbret/oboku-api:preview
    container_name: oboku-preview-api
    restart: always
    depends_on:
      - oboku-preview-couchdb
      - oboku-preview-postgres
    environment:
      NODE_ENV: production
      APP_PUBLIC_URL: https://preview.oboku.me
      ADMIN_PUBLIC_URL: https://preview-admin.oboku.me
      COUCH_DB_URL: http://oboku-preview-couchdb:5984
      POSTGRES_HOST: oboku-preview-postgres
      POSTGRES_DB: oboku
      POSTGRES_PASSWORD: CHANGE_ME_POSTGRES
      JWT_PRIVATE_KEY_FILE: /secrets/jwt_private_key.pem
      JWT_PUBLIC_KEY_FILE: /secrets/jwt_public_key.pem
      API_DATA_DIR: /var/lib/oboku/data
      API_CONFIG_DIR: /var/lib/oboku/config
      ADMIN_LOGIN: admin
      ADMIN_PASSWORD: CHANGE_ME_ADMIN
    volumes:
      - oboku-preview-secrets:/secrets:ro
      - oboku-preview-api-data:/var/lib/oboku/data
      - oboku-preview-api-config:/var/lib/oboku/config
    networks:
      - oboku-preview

  oboku-preview-web:
    image: mbret/oboku-web:preview
    container_name: oboku-preview-web
    restart: always
    environment:
      VITE_API_URL: https://preview-api.oboku.me
    networks:
      - oboku-preview

  oboku-preview-admin:
    image: mbret/oboku-admin:preview
    container_name: oboku-preview-admin
    restart: always
    environment:
      VITE_API_URL: https://preview-api.oboku.me
    networks:
      - oboku-preview

networks:
  oboku-preview:

volumes:
  oboku-preview-secrets:
  oboku-preview-couchdb-data:
  oboku-preview-couchdb-config:
  oboku-preview-postgres:
  oboku-preview-api-data:
  oboku-preview-api-config:
```

## Resetting

Data survives image updates, and migrations only move forward. When a branch leaves the preview data in the way, delete the `oboku-preview-*` containers and volumes and import the template again. Clear the site data of `preview.oboku.me` in the browser as well: its local database would otherwise replicate the old documents into the new stack.
