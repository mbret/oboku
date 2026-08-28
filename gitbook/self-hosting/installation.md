# Installation

## Prerequisites

* `https`: **(Required)** The web app rely heavily on service worker (notably to stream content) and sign-in binds your session to the device using the Web Crypto API. Browsers only expose both of these on secure contexts, so you need to serve the web app through https — on plain http (e.g. `http://<lan-ip>`) sign-in will fail outright. It can be self signed certificate. It will also work without https on localhost. The provided docker image for the web app does not embed self signed certificate.
* `same site`: **(Required)** The web app and the API must be served from the same **site**, meaning the same registrable domain. Serving both from one hostname on different ports is the default (`oboku.example.com` and `oboku.example.com:3000`). Separate subdomains also work (`oboku.example.com` and `oboku-api.example.com`) as long as you point `VITE_API_URL` at the API origin and `APP_PUBLIC_URL` at the web app's, since the API only accepts credentialed requests from `APP_PUBLIC_URL`'s hostname. Auth rides on `SameSite=Lax` httpOnly cookies, so an API served from a different site (`oboku.app` / `oboku-api.dev`) never receives them and sign-in fails.
* `HTTP/2`: (**Recommended**) The database is reached through the API, and replicating many collections needs many parallel connections. HTTP/1 caps connections per origin and will block some requests, so serve the API behind an HTTP/2 reverse proxy. Without HTTP/2 you must instead expose several API origins (see `VITE_API_URL_2/3/4` in [configuration/environment-variables.md](configuration/environment-variables.md "mention")).
* `dropbox`: **(Optional)** To have a dropbox support, you will need to create a developer account and configure credentials.
* `google drive`: **(Optional)** To have a google drive support, you will need to create a developer account and configure credentials

## Considerations

By default, there are strong limitations put in place to reduce memory / CPU usage. This allow the stack to run on cheaper servers. You can change some settings if you have a beefier server. If you plan on intensive usage with lot of books, visit our [enable-features.md](configuration/enable-features.md "mention")section. Some options can help you reduce the costs of hosting.

{% hint style="warning" %}
**Run the API as a single instance.** Do not run multiple API replicas behind a load balancer or scale it horizontally. Refresh-token rotation keeps a short-lived, per-process in-memory key to safely converge concurrent and retried refreshes onto a single token. A second instance cannot share that key, so the same session could end up with two valid tokens and clients may be unexpectedly signed out. Scale vertically (a bigger server) instead. CouchDB and Postgres can be scaled independently.
{% endhint %}

## Installation with docker compose (recommended)

{% hint style="success" %}
For an easier server deployment consider using [https://cosmos-cloud.io/](https://cosmos-cloud.io/) and follow our next section related to cosmos
{% endhint %}

This setup assume this final minimal structure on your server:

```bash
/oboku
  .env
  docker-compose.yml
  /secrets                 # created on first start
    jwt_private_key.pem
    jwt_public_key.pem
```

### Setup environment variables

Provide the minimum required env variables for your compose file.

{% code title=".env" %}
```bash
# couchdb is exposed publicly so you should consider a strong password.
COUCHDB_PASSWORD=createastrongpassword
# postgres does not need to be exposed publicly but you should 
# still consider a strong password.
POSTGRES_PASSWORD=createastrongpassword
```
{% endcode %}

### Setup your secrets

#### Private & Public JWT secret

oboku signs its sessions with an RSA key pair. CouchDB generates one into `./secrets` the first time the stack starts, so a normal install has nothing to do here.

{% hint style="warning" %}
Keep `./secrets` across upgrades and include it in your backups. The pair is only ever created when missing, so restarts keep signing with the same keys. If you lose it a new pair is generated. Signed-in readers are not logged out, because their sessions refresh against tokens held server side, but the admin panel signs its own tokens with this pair, so administrators have to sign in again — and any sign-up or magic link already sent out stops working.
{% endhint %}

To use your own key pair instead, create it before the first start and it will be left alone:

```bash
mkdir -p ./secrets
openssl genrsa -out ./secrets/jwt_private_key.pem 4096
openssl rsa -in ./secrets/jwt_private_key.pem -pubout -outform PEM -out ./secrets/jwt_public_key.pem
```

You can also supply the keys base64 encoded through `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` rather than as files.

### Setup compose file

You can then create a docker compose for the project. We have a default one [here](../../docker-compose.yml)

### Start

After creating your docker compose, run this command in the same directory

```bash
docker compose up -d
```

### Update

```bash
docker compose pull
docker compose up -d
```

## Installation with Cosmos

TODO

