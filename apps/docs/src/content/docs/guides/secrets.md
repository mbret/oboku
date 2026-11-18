---
title: "Secrets"
---

Secrets are how you keep your confidential information safe.

Some configuration such as adding a datasource or configuring extra features will requires you to provide confidential information only you should know. Although oboku will need to use them at some points, they are encrypted in your own database and can be decrypted only by you. The one exception is the password of a connector you connect: see [Passwords kept by oboku's server](#passwords-kept-by-obokus-server).

This means that if oboku were compromised, an attacker would have no way to read your secrets, except the passwords of connected connectors.

When oboku needs to read your secrets to perform actions (eg: synchronize a datasource) it will prompt you for your passport and use the decrypted secrets only for that process lifetime. They will be kept in memory and discarded as soon as the process is done.

## Passwords kept by oboku's server

When you [connect a connector](/guides/connectors#connect-a-connector), oboku decrypts its password once and sends it to oboku's server, so that your [OPDS servers](/guides/opds-servers) can serve the connector's books. The server keeps the password encrypted, but unlike your other secrets, the server can read it.

* The server sends the password only to the connector's address, for its username.
* If you edit the connector, or put a new password in its secret, the server stops using the password until you connect the connector again.
* If you disconnect the connector, the server forgets the password. Deleting the connector or its password secret makes it forget the password too, once the deletion has synced and a reading app opens one of your OPDS catalogs or you open a WebDAV connector in oboku: see [Disconnect](/guides/connectors#disconnect).
* If the connector's server refuses the password, the server forgets it, and you connect the connector again. A server can refuse a correct password while its own sign-in service is down.
* Changing or removing your master password does not disconnect the connector.

Connecting is your decision for each connector. A connector you do not connect keeps its password a secret that only you can decrypt.

## Master Password

To manage secrets you need to first setup a master password. This is a password set on your profile which will be used to encrypt / decrypt secrets. You can change your password whenever you want without affecting your secrets but in the situation were you lose it and want to reset it all your secrets will be lost.

:::caution
If you lose your master password and want to reset it, keep in minds all your secrets will be unusable and have to be redo again.
:::

