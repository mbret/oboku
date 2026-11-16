---
title: "Connectors"
---

Connectors are a group of settings that can be created and reused for a given provider. This allows you to store your webdav or synology credentials and be able to re-use them later for example.

Unlike secrets, they are not encrypted. They are generally used for username, urls, etc.

## Connect a connector

Connecting a connector lets oboku's server keep its password, so that your [OPDS servers](/guides/opds-servers) can serve its books without your browser. Only WebDAV connectors can be connected for now.

The connection is optional, and it is your decision for each connector. Without it, the password stays a [secret](/guides/secrets) that only you can decrypt.

### What it changes

When you connect a connector, oboku decrypts its password once and sends it to oboku's server, which keeps a copy of the connector with it and uses the password only while the connector still matches that copy. See [Passwords kept by oboku's server](/guides/secrets#passwords-kept-by-obokus-server) for what the server keeps and when it stops using it.

### Connect

1. Open **Integrations > WebDAV**, then select the connector.
2. Under **Connection**, tap **Connect**.
3. Read what oboku's server will keep, then tap **Connect**.
4. Enter your master password.

oboku's server signs in to the connector's server with the password first, and keeps nothing if it cannot. The screen then shows **Connected** and when you connected it.

If you edited the connector or its password since you connected it, the screen says so, and offers **Connect again**.

### Disconnect

Tap **Disconnect this connector** in the connector's danger zone, then confirm. oboku's server forgets the password, and the connector stays in your settings.

Deleting a connector disconnects it too. If you are offline, oboku tells its server once you are back online. If you close oboku first, or its server cannot be reached, the server keeps the password until the deletion has synced and you open a WebDAV connector in oboku. To be sure, disconnect before you delete.
