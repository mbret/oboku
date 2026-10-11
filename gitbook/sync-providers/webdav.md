# WebDAV

Oboku lets you use WebDAV server to synchronize your books but you need to make sure your WebDAV server is configured in a way that works.

## CORS

Your server needs to returns a valid CORS. You cannot use a wildcard `*` because oboku needs to sends credentials. This means you will have to specify the origin. If you use the cloud version, you can use https://app.oboku.me. If you use the self host version, use whatever host / ip you use.

## OPTIONS

Your browser will not sends the credentials for a preflight request (see [https://fetch.spec.whatwg.org/#http-cors-protocol](https://fetch.spec.whatwg.org/#http-cors-protocol)). This means your server must returns a valid HTTP status when responding to OPTIONS requests. This is a common issue with synology WebDAV server which requires authentication even for OPTIONS requests.

You can configure a reverse proxy in front of your WebDAV server and intercept OPTIONS requests to return a 200 status

## Servers on your local network

oboku's server connects to your WebDAV server for syncs and downloads, and it only reaches servers on the public internet unless its instance allows private networks. A server on the machine oboku runs on counts as private too. On a self-hosted instance, an admin can allow your server, or private networks as a whole, from the [admin panel](../self-hosting/admin.md#private-networks) to use a server on your local network or on that machine.

## Sync behavior

When you sync you can prodive a directory as "root" or leave it empty for `/` path. This directory is from where the sync begins and therefore all sub folders will start being detected as collection.
