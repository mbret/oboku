# Environment Variables

Your environment variables livers under `./.env` file.&#x20;

Some variables let you enable specific features, visit the [related section](enable-features.md) to see their detailed use.

{% code title=".env" %}
```bash
# couchdb is reachable only through the API (proxied under /couchdb).
# Set a strong admin password.
COUCHDB_PASSWORD=createastrongpassword
# postgres does not need to be exposed publicly but you should 
# still consider a strong password.
POSTGRES_PASSWORD=createastrongpassword
# This is the API url endpoint used by the web apps
# By default, it will point to the same origin as the web app
# and port 3000.
VITE_API_URL=yourapiurl
# Additional API origins used by the web apps. CouchDB is proxied by the API,
# so replication runs against the API itself. Due to a limitation with HTTP/1
# (a low cap on connections per origin), replicating many collections at once
# needs several origins. These are extra origins serving the same API; hits are
# distributed across them. They default to VITE_API_URL. If you serve the API
# over HTTP/2 you can leave them unset, since HTTP/2 has no per-origin limit.
VITE_API_URL_2=yourapiurl2
VITE_API_URL_3=yourapiurl3
VITE_API_URL_4=yourapiurl4
APP_PUBLIC_URL=http://app-public-url
```
{% endcode %}

## Admin credentials

Needed to sign in through the admin panel.

```
ADMIN_LOGIN=admin
ADMIN_PASSWORD=password
```

## Email provider

Not mandatory but will unlock more features (eg: user self-registration flow). `APP_PUBLIC_URL` is required when using email provider because it is used in some emails for redirection.

```
EMAIL_SMTP_HOST=email-smtp.your-provider.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=user
EMAIL_SMTP_PASSWORD=password
EMAIL_FROM=yourcontactemail
# Optional. Display name shown to recipients, producing a From header of
# "oboku <yourcontactemail>". Defaults to "oboku".
EMAIL_FROM_NAME=oboku
```
