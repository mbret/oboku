# Admin

The admin panel is available by default at port `3003` . You have to setup a login and password to be able to sign in. This is not a user credential and is specific to the admin. Visit the [configuration](configuration/ "mention") section to setup your credentials.

## Hosting the panel on its own hostname

The default port-`3003` setup shares the web app's hostname and needs no configuration. Serving the panel from a different hostname (`admin.example.org` next to `app.example.org`) requires naming it:

```
ADMIN_PUBLIC_URL=https://admin.example.org
```

Without it the browser blocks every call the panel makes with a CORS error. The origins the API accepts are printed on start-up (`Browser origins — ...`), so compare that line with the origin in the browser error.

The panel signs in with a Bearer token and never sends cookies, so this grants it nothing beyond reaching `/admin/*`: no cookie access, and no exemption from the CSRF origin check that protects reader sessions.

## User account creation

Visit the [user-accounts.md](user-accounts.md "mention") section

## Private networks

The API sends requests to the addresses users enter: their WebDAV and Synology Drive servers, the links they add and the covers their collections point to. By default it only connects to servers on the public internet, so that nobody with an account can use those requests to reach your network or the services running next to the API. The machine's own addresses count as private too, public ones included: a request to them never leaves the machine, so it would reach whatever listens there.

If your users keep their books on your network or on the machine running oboku, on a NAS or a WebDAV server at home for instance, check **Allow requests to private networks** on the panel's home page. It applies right away, without a restart. Only allow it when you trust everyone with an account on your instance.

To let only some servers through, list them under **Allowed hosts** instead, one per line: a host (`nas.local`), a host and port (`nas.local:5001`), or a URL (`http://192.168.1.20:5005`), of which only the host and port count. A host without a port opens every service on it, so give the port whenever you can, and always for the machine running oboku.

Requests to the API itself always go through: to the URLs the web app reaches it at (`VITE_API_URL` and its variants, or without them the web app's address on port 3000), and to `localhost` on the API's port. They only reach the API, which users can call anyway.

The API cannot tell when a public address leads back into your own network, for instance the host's public IP seen from inside a container, or another of your servers. Keep internal services such as CouchDB and Postgres off public addresses: bind them to loopback or a private network, or leave their ports unpublished, as the provided `docker-compose.yml` does.

## Security

The **Security** section lists the refresh tokens currently issued and lets you revoke them, either for every user or for specific email addresses. Revoked tokens are deleted outright, so the affected users have to sign in again.

### Rotating the JWT key pair

Sessions and the JWT key pair are deliberately independent, so replacing the pair is **not** a way to sign everyone out:

* The pair signs access tokens, sign-up links, magic links, and the admin panel's own tokens. Replacing it invalidates all of those immediately.
* A reader's session does not depend on it. Refresh tokens are random values stored server side and bound to a key held by that browser, so clients simply refresh and carry on with tokens signed by the new pair.

Which of the two you need depends on what leaked:

* **The private key leaked.** Replace the pair. Forged tokens stop validating as soon as the new one is in place. Sessions can keep running, since the leak does not expose refresh tokens or the browser-held keys they are bound to.
* **A session leaked, or you want everyone signed out.** Revoke the tokens from the Security section. This is the only action that ends sessions.
* **You are unsure, or the server itself was compromised.** Do both, in that order.

To replace the pair, stop the stack, delete the files in `./secrets`, and start it again — a new pair is generated on start. See [installation.md](installation.md "mention").
