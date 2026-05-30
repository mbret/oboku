# Environment Variables

Your environment variables livers under `./.env` file.&#x20;

Some variables let you enable specific features, visit the [related section](enable-features.md) to see their detailed use.

{% code title=".env" %}
```bash
# couchdb is exposed publicly so you should consider a strong password.
COUCHDB_PASSWORD=createastrongpassword
# postgres does not need to be exposed publicly but you should 
# still consider a strong password.
POSTGRES_PASSWORD=createastrongpassword
# This is the API url endpoint used by the web apps
# By default, it will point to the same origin as the web app
# and port 3000.
VITE_API_URL=yourapiurl
# This is the couchdb url endpoint used by the web apps.
# Due to limitation with http1 we use 4 endpoints so hits can be
# distributed evenly. by default it uses the same origin 
# as the web app and the 4 ports open by the docker compose. 
# If you are using http2, you can use the
# same url and port as it does not have the same limitation.
VITE_COUCH_DB_PUBLIC_URL=couchdburl
VITE_COUCH_DB_PUBLIC_URL_2=couchdburl2
VITE_COUCH_DB_PUBLIC_URL_3=couchdburl3
VITE_COUCH_DB_PUBLIC_URL_4=couchdburl4
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
```
