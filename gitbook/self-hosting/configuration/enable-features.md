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
