# Admin

The admin panel is available by default at port `3003` . You have to setup a login and password to be able to sign in. This is not a user credential and is specific to the admin. Visit the [configuration](configuration/ "mention") section to setup your credentials.

## User account creation

Visit the [user-accounts.md](user-accounts.md "mention") section

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
