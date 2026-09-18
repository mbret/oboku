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
