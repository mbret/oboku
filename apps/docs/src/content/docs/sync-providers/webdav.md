---
title: "WebDAV"
---

Oboku lets you use WebDAV server to synchronize your books but you need to make sure your WebDAV server is configured in a way that works.

## CORS

Your server needs to returns a valid CORS. You cannot use a wildcard `*` because oboku needs to sends credentials. This means you will have to specify the origin. If you use the cloud version, you can use https://app.oboku.me. If you use the self host version, use whatever host / ip you use.

## OPTIONS

Your browser will not sends the credentials for a preflight request (see [https://fetch.spec.whatwg.org/#http-cors-protocol](https://fetch.spec.whatwg.org/#http-cors-protocol)). This means your server must returns a valid HTTP status when responding to OPTIONS requests. This is a common issue with synology WebDAV server which requires authentication even for OPTIONS requests.

You can configure a reverse proxy in front of your WebDAV server and intercept OPTIONS requests to return a 200 status

## Use oboku's server as a proxy

Some WebDAV servers refuse requests from the browser, and you cannot change their CORS or OPTIONS answers. Koofr (`https://app.koofr.net/dav/Koofr`, with an app password) is one of them. For such a server, check **Use oboku's server as a proxy** on the connector.

oboku's server then lists the WebDAV server's folders when you add a book or test the connection, and downloads your books from it and passes them on to you. It only downloads a file whose size the WebDAV server states, and stops at that size. These downloads count towards your [monthly download quota](/guides/opds-servers#monthly-download-quota) and towards the quota of all users. **Profile > Quotas** shows how much of each is used this month.

Without the setting, your browser downloads books from the WebDAV server, and they do not count towards the quota.

## Servers on your local network

oboku's server connects to your WebDAV server for syncs and downloads, and to list your folders when it is the connector's proxy. It only reaches servers on the public internet unless its instance allows private networks. A server on the machine oboku runs on counts as private too. On a self-hosted instance, an admin can allow your server, or private networks as a whole, from the [admin panel](/self-hosting/admin#private-networks) to use a server on your local network or on that machine.

## Connect for OPDS servers

Your [OPDS servers](/guides/opds-servers) can serve the books of a WebDAV connector once you connect it: oboku's server then keeps the connector's password and downloads the books itself. See [Connect a connector](/guides/connectors#connect-a-connector) for how, and [Passwords kept by oboku's server](/guides/secrets#passwords-kept-by-obokus-server) for what the server keeps.

- oboku's server signs in to your WebDAV server when you connect, so the rules of [Servers on your local network](#servers-on-your-local-network) apply. On the cloud version, your server must be reachable from the internet.
- The password often opens your whole server. If your server allows it, connect with an account that can only read your books, or with an app password.

## Sync behavior

When you sync you can provide a directory as "root" or leave it empty for `/` path. This directory is from where the sync begins and therefore all sub folders will start being detected as collection.
