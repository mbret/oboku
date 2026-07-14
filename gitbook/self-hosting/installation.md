# Installation

## Prerequisites

* `https`: **(Required)** The web app rely heavily on service worker (notably to stream content) and sign-in binds your session to the device using the Web Crypto API. Browsers only expose both of these on secure contexts, so you need to serve the web app through https — on plain http (e.g. `http://<lan-ip>`) sign-in will fail outright. It can be self signed certificate. It will also work without https on localhost. The provided docker image for the web app does not embed self signed certificate.
* `same hostname`: **(Required)** The web app and the API must be served from the same **hostname** (ports may differ), e.g. `oboku.example.com` and `oboku.example.com:3000`. Auth rides on host-scoped httpOnly cookies, so serving them from different hostnames (`app.example.com` / `api.example.com`) is not supported.
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
  /secrets
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

From the same folder you plan to start your docker compose, run this command.

```bash
openssl genrsa -out ./secrets/jwt_private_key.pem 4096
openssl rsa -in ./secrets/jwt_private_key.pem -pubout -outform PEM -out ./secrets/jwt_public_key.pem
```

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

