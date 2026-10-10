# Security policy

Report a vulnerability privately, through GitHub: on the [Security tab](https://github.com/mbret/oboku/security), click **Report a vulnerability**. Don't open a public issue or pull request for it, and don't post it on Discord or Reddit.

The report opens a private security advisory that only you and the maintainer can see. The discussion and the fix happen there.

## What to include

- what an attacker can do, and what they need first, such as an account, a shared library or network access to a self-hosted API;
- the steps to reproduce, or a proof of concept;
- where it applies: [app.oboku.me](https://app.oboku.me), a self-hosted instance with the image tag you run, or both;
- the part involved, if you know it: the web app, the API, CouchDB or a sync provider.

## Supported versions

Security fixes ship in a new release, and only the latest release gets them. app.oboku.me always runs it. A self-hosted instance gets the fix by moving to that release:

- with untagged or `latest` images, run `docker compose pull`, then `docker compose up -d`;
- with a pinned tag, such as `2.5.0`, first change every oboku image to the release with the fix, since pulling again only fetches the pinned version.
