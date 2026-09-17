# Enable features

## Allow Google Sign In method

You need to provide one more env variable:

* `GOOGLE_CLIENT_ID`: Create a new OAuth 2.0 Client IDs in the google cloud console.

## Enable Google Drive support

{% hint style="success" %}
Let you add books and datasources from google drive
{% endhint %}

You need to provide two more env variables

* `GOOGLE_CLIENT_ID`: You can use the same as for google sign in.&#x20;
* `GOOGLE_API_KEY`: You need to create a new API Keys credential in the google cloud console and  enable the following APIs:
  * Google Picker API

{% hint style="danger" %}
The `GOOGLE_API_KEY` is public so make sure to apply enoughts constraints on it to prevent abuses
{% endhint %}



## Enable Google Book Metadata

{% hint style="success" %}
Will use google book API to enrich metadata
{% endhint %}

To be able to enrich your metadata with google book, you need to provide:&#x20;

* `GOOGLE_API_KEY`: You need to create or update the API Keys credential in the google cloud console and  enable the following API
  * Books API

## Enable ComicVine support

{% hint style="success" %}
Will use comic vine API to enrich metadata
{% endhint %}

You need to provide one more env variable:

* `COMICVINE_API_KEY`: Create a new API key at [https://comicvine.gamespot.com/api/](https://comicvine.gamespot.com/api/)

## Enable Amazon s3 storage for covers

{% hint style="success" %}
Let you store and retrieve covers from s3 rather than file system.&#x20;
{% endhint %}

You need to provide:

* `AWS_ACCESS_KEY_ID`: Create an amazon access key&#x20;
* `AWS_SECRET_ACCESS_KEY`: Then pass the secret key
* `COVERS_STORAGE_STRATEGY`: Set this value to `s3`

## Enable the download proxy

{% hint style="success" %}
Lets the app download books from providers whose server sends no CORS headers
{% endhint %}

oboku normally downloads a book straight from the provider to your browser. Browsers only allow that when the provider's server opts in with CORS headers, which the vendor APIs (Google Drive, Dropbox, OneDrive) do but a plain HTTP server often does not. Without CORS the library still syncs — that part runs on the API — but opening the book fails.

With the proxy enabled, the API fetches the file and streams it to the app instead, so no CORS header is needed. It applies to the providers reached over plain HTTP(S): URI, WebDAV and Synology Drive.

Turn it on from the admin panel, under Downloads. Book files then travel through your instance, so it pays that bandwidth — which is why it is off by default. The same section caps what a single download may stream.

{% hint style="warning" %}
The proxy makes your instance fetch a url the user controls. Targets that resolve outside public address space are refused, so a link cannot be pointed at your own network.

If your providers live on a LAN or on localhost, allow them explicitly:

```
DOWNLOAD_ALLOW_PRIVATE_NETWORK=true
```

This one is an environment variable rather than an admin setting on purpose: it widens what your instance can reach, so it should be a deploy-time decision and not something flippable from a web session. Only set it on an instance whose users you trust, since it also lets them reach anything else your instance can reach.
{% endhint %}
