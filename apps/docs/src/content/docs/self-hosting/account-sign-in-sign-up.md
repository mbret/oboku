---
title: "Account Sign in / Sign up"
---

:::caution
**HTTPS is mandatory for sign-in.** Every sign-in method binds your session to the device using the Web Crypto API, which browsers only expose on secure contexts (https or localhost). If you serve the web app over plain http (e.g. `http://<lan-ip>`), sign-in will fail. See the [Installation](/self-hosting/installation) prerequisites.
:::

Oboku currently supports two ways to sign in

## Google Sign-In

If you add support for google sign in you can use this method. See the [Configuration](/self-hosting/configuration) section

## Local (email/password) { #local-email-password }

This is more of the regular way and does not involves any external providers. This is also the default login method when self-hosting. This is the normal "register" flow on the sign in page. Local account requires a valid email so user will be asked to continue the flow from a link sent to their provided email. Read the following section regarding emails.

### With email provider setup

If you havev configured an email provider, users will be able to register themsveles through the normal registration flow. They will receive a verification email to allow their account creation. Visit the [Configuration](/self-hosting/configuration) section to learn how to configure your email provider.

### Without email provider setup

If you have not configured an email provider, users will not be able to receive a confirmation email directly. You need to generate a link yourself through the admin panel. Visit the [Admin](/self-hosting/admin) section to learn more.
