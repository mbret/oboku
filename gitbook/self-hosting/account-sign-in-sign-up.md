# Account Sign in / Sign up

{% hint style="warning" %}
**HTTPS is mandatory for sign-in.** Every sign-in method binds your session to the device using the Web Crypto API, which browsers only expose on secure contexts (https or localhost). If you serve the web app over plain http (e.g. `http://<lan-ip>`), sign-in will fail. See the [installation](installation.md "mention") prerequisites.
{% endhint %}

Oboku currently supports two ways to sign in

## Google Sign-In

If you add support for google sign in you can use this method. See the [configuration](configuration/ "mention") section

## Local (email/password)

This is more of the regular way and does not involves any external providers. This is also the default login method when self-hosting. This is the normal "register" flow on the sign in page. Local account requires a valid email so user will be asked to continue the flow from a link sent to their provided email. Read the following section regarding emails.

### With email provider setup

If you havev configured an email provider, users will be able to register themsveles through the normal registration flow. They will receive a verification email to allow their account creation. Visit the [configuration](configuration/ "mention") section to learn how to configure your email provider.

### Without email provider setup

If you have not configured an email provider, users will not be able to receive a confirmation email directly. You need to generate a link yourself through the admin panel. Visit the [admin.md](admin.md "mention") section to learn more.

## Sign-up fails with "was not created by couch_peruser before the deadline"

Every account owns a CouchDB database that CouchDB's `couch_peruser` creates when the user is written to `_users`. When sign-up fails with this error in the API log, `couch_peruser` has stopped processing `_users`. Confirm it in the CouchDB log, which repeats a line like `Supervisor couch_peruser_sup had child couch_peruser ... exit with reason normal`.

The usual cause is CouchDB's default `delete_dbs = false`. On a deleted user, `couch_peruser` edits the security of that user's database and crashes when the database is already gone, which is always the case after an oboku account deletion. It then restarts, replays `_users` from the beginning, hits the same deleted user and never provisions another database ([apache/couchdb#6086](https://github.com/apache/couchdb/issues/6086)). Until it is fixed, every new account gets a 500 on its first sign-in and, on retry, an app that works locally but never syncs. The API also lists the affected accounts at startup as orphan `_users` docs.

The bundled CouchDB image ships `delete_dbs = true`, which tolerates a missing database, so pulling the latest image and restarting CouchDB is enough. If you run your own CouchDB, set it yourself and restart CouchDB:

```bash
curl -X PUT http://admin:password@your-couchdb:5984/_node/_local/_config/couch_peruser/delete_dbs -d '"true"'
```

This is safe: oboku destroys the database itself before deleting the user, so there is nothing left for `couch_peruser` to delete. On restart `couch_peruser` replays `_users`, creates every missing database, and the affected accounts start syncing on their own. Deleted users remain in `_users` as tombstones and are harmless.
