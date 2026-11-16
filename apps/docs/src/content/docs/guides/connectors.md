---
title: "Connectors"
---

Connectors are a group of settings that can be created and reused for a given provider. This allows you to store your webdav or synology credentials and be able to re-use them later for example.

Unlike secrets, they are not encrypted. They are generally used for username, urls, etc.

## Connect a connector

Connecting a connector lets oboku's server keep its password, so that your [OPDS servers](/guides/opds-servers) can serve its books without your browser. Only WebDAV connectors can be connected for now.

The connection is optional, and it is your decision for each connector. Without it, the password stays a [secret](/guides/secrets) that only you can decrypt.

### What it changes

When you connect a connector, oboku decrypts its password once and sends it to oboku's server. The server keeps it encrypted, but unlike your other secrets, the server can read it. See [Passwords kept by oboku's server](/guides/secrets#passwords-kept-by-obokus-server).

The server keeps a copy of the connector with the password, and uses the password only while the connector still matches that copy:

* It sends the password only to the connector's address, for its username.
* If you edit the connector, or put a new password in its secret, the server stops using the password. Connect the connector again to use the new settings.

### Connect

1. Open **Integrations**, then the connector's provider, such as **WebDAV**.
2. Select the connector.
3. Under **Connection**, tap **Connect**.
4. Read what oboku's server will keep, then tap **Connect**.
5. Enter your master password.

oboku's server signs in to the connector's server with the password first, and keeps nothing if it cannot. The screen then shows **Connected** and when you connected it.

If you edited the connector or its password since you connected it, the screen says so, and offers **Connect again**.

### Disconnect

Tap **Disconnect this connector** in the connector's danger zone, then confirm. oboku's server forgets the password, and the connector stays in your settings.

Deleting a connector disconnects it too. If you delete it while offline, oboku's server forgets the password the next time it checks your connectors.
