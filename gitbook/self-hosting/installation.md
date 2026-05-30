# Installation

## Prerequisites

* `https`: **(Required)** The web app rely heavily on service worker (notably to stream content) so you need to serve the web app through https. It can be self signed certificate. It will also work without http on localhost. The provided docker image for the web app does not embed self signed certificate.
* `HTTP/2`: (**Recommended**) Many parallel requests needs to be done on the database, http/1 has limitations and will blocks certain requests. You need at least http/2 in front of couchdb
* `dropbox`: **(Optional)** To have a dropbox support, you will need to create a developer account and configure credentials.
* `google drive`: **(Optional)** To have a google drive support, you will need to create a developer account and configure credentials

## Considerations

By default, there are strong limitations put in place to reduce memory / CPU usage. This allow the stack to run on cheaper servers. You can change some settings if you have a beefier server. If you plan on intensive usage with lot of books, visit our [enable-features.md](configuration/enable-features.md "mention")section. Some options can help you reduce the costs of hosting.

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

