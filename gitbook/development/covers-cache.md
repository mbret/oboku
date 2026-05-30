# Covers Cache

In order to keep the covers available offline we cache them on the [https://developer.mozilla.org/en-US/docs/Web/API/Cache](https://developer.mozilla.org/en-US/docs/Web/API/Cache) API. The service worker will cache them as they are fetched.

## Serving strategy

The service worker will intercept any fetch requests to covers and serve the cache if it exists. If the cover is not cached yet, we fetch it normally and register it on the cache.

## TTL

The TTL is infinite by default. The cleanup will happens periodically (every 5mn) and cleanup what needs to be following several strategies.

## Cleanup strategy

### Cover outdated

A cover can become outdated if there is a new cover url for a given cover. This can happens if the cover has been updated following a sync or metadata refresh. In this situation the asset url will change and a new cover will be fetched. The cleanup periodically check for outdated cover and remove them from the cache

### Book not existing anymore

When a book is removed or just not found for a given user, a periodic cleanup will check the database and remove all covers that are not related to any books.

### Profile `undefined`

We will check the profile periodically and remove all covers if it is undefined.

Profile changed

We periodically check if the existing covers in cache belongs to the current profile. If not we remove them.

## Catastrophic situations

### Cache erased by browser

The browser can decide to remove all or part of the cache depending on the user space on device. In this situation the covers will be blank until the user is connected to the internet again. This is not a problem.

### Cache erased by user

Same as above.
