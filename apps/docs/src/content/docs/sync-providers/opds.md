---
title: "OPDS"
---

oboku can sync the free books of an OPDS catalog, the protocol that self-hosted library servers such as Komga, Calibre-Web and Kavita share. A sync reads one feed of the catalog and creates books and collections from it, like the other sync providers.

## What is supported

- OPDS 1 catalogs, whose feeds are Atom XML. OPDS 2 catalogs (JSON) are not supported yet.
- Free books only: the ones the catalog offers to download as a whole, without buying, borrowing or subscribing. Samples are skipped too.
- The formats oboku can read, going by the type the catalog gives each file. When a book comes in several formats, oboku takes the first one it can read.
- Reading only: oboku never uploads books to the catalog or deletes them from it.
- Like with other providers, books get their metadata and cover from their file.

## Connector

An OPDS data source needs a connector, which holds:

- **URL**: the address of your catalog server, starting with `http://` or `https://`.
- **Username** and **password**: your login on the catalog, the password kept in a [secret](/guides/secrets). oboku sends them with HTTP Basic authentication, and only with requests to the connector's address: its scheme, host and port. A catalog that serves its files from another host, a CDN for instance, never receives them. If your server redirects `http://` to `https://`, enter its `https://` address.
- **Allow self-signed certificate**: for a server using a self-signed certificate. Since books download from your browser, open your server's address once in it to trust the certificate as well.

Kavita does not ask OPDS readers to log in: the OPDS URL it gives you carries your key. Enter your username and any password.

## Which feed to sync

A data source syncs the feed whose URL you enter, which has to be on the connector's server. oboku follows it down: each entry leading to another feed becomes a folder of what that feed holds, so the sections of the feed you enter become collections. In a feed listing series, each series becomes a collection. oboku does not follow the links that lead back up the catalog, to searches, to related feeds, or to sorted and filtered views of the same books.

Enter a list such as the catalog's series rather than its root, or entries like "Recently added" become collections. Lists that change on their own, like Komga's "Keep reading", make poor collections too: a book stays in a collection after its feed stops listing it. For instance:

- **Komga**: all series at `https://komga.example.com/opds/v1.2/series`, or `/opds/v1.2/libraries`, `/opds/v1.2/collections` and `/opds/v1.2/readlists` on the same server. The catalog's root is `/opds/v1.2/catalog`.
- **Calibre-Web**: all series at `https://calibre-web.example.com/opds/series/letter/00`, or the shelves at `/opds/shelfindex`. `/opds/series` lists letters, which would become the collections. The catalog's root is `/opds`.
- **Kavita**: start from the OPDS URL your user settings give you, and follow the catalog to the list you want.

To find a feed, open the catalog in an OPDS reader, or its root in your browser, which shows the XML, and follow the entries to the list you want.

oboku reads every page of a feed. To keep a sync from running forever, it stops ten feeds down from the one you enter, and after 5,000 feeds.

## CORS

Books download from your browser, straight from the catalog, so the catalog has to allow it. Its answers to file downloads, redirects included, must:

- allow oboku's origin in `Access-Control-Allow-Origin`: `https://app.oboku.me` on the cloud version, or the address you open oboku at when you self-host it,
- list `Authorization` in `Access-Control-Allow-Headers`, which a `*` does not cover,
- answer the `OPTIONS` preflight request without asking for credentials, since browsers never send them with it (see [https://fetch.spec.whatwg.org/#http-cors-protocol](https://fetch.spec.whatwg.org/#http-cors-protocol)).

Listing `Content-Disposition` in `Access-Control-Expose-Headers` as well lets oboku name the files the way the catalog does. Otherwise it names them after the book's title.

A host the catalog redirects a download to receives no credentials, and has to answer with `Access-Control-Allow-Origin: *`: after a redirect from one server to another, browsers send `Origin: null`.

Komga does all of this once its `komga.cors.allowed-origins` setting, or the `KOMGA_CORS_ALLOWED_ORIGINS` environment variable, lists oboku's origin. If your server has no CORS settings, you can put a reverse proxy in front of it to add these headers.

Feeds need none of this, since oboku's server fetches them. Downloading through oboku's server, for catalogs that cannot allow CORS at all, is tracked in [#859](https://github.com/mbret/oboku/issues/859).

## Servers on your local network

oboku's server connects to your catalog to read its feeds during syncs and to download books to read their metadata, and it only reaches servers on the public internet unless its instance allows private networks. A server on the machine oboku runs on counts as private too. On a self-hosted instance, an admin can allow your server, or private networks as a whole, from the [admin panel](/self-hosting/admin#private-networks) to use a server on your local network or on that machine.

## Limitations

- oboku recognizes a book by the id the catalog gives its entry. A server that changes these ids, when it rebuilds or re-imports its library for instance, makes every book come back as a new one, without its reading progress.
- oboku recognizes a collection by the address of its feed. When that address changes, because your server moves or you get a new Kavita key for instance, the next sync creates new collections and leaves the old ones in place.
- Each sync refreshes the metadata of the books whose entry has a new update date. A server that dates every entry with the current time makes every sync refresh every book.
- Komga gives CBR files a type that oboku does not take yet, `application/x-rar-compressed`, so a sync skips them.
- A catalog without a login cannot be synced yet.
- The catalog's own authors, ISBN, cover and summary are not used yet.
