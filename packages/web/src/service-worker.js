(function() {
  "use strict";
  try {
    self["workbox:core:6.5.2"] && _();
  } catch (e) {
  }
  const fallback$3 = (code, ...args) => {
    let msg = code;
    if (args.length > 0) {
      msg += ` :: ${JSON.stringify(args)}`;
    }
    return msg;
  };
  const messageGenerator$3 = fallback$3;
  let WorkboxError$3 = class WorkboxError extends Error {
    constructor(errorCode, details) {
      const message = messageGenerator$3(errorCode, details);
      super(message);
      this.name = errorCode;
      this.details = details;
    }
  };
  ({
    googleAnalytics: "googleAnalytics",
    precache: "precache-v2",
    prefix: "workbox",
    runtime: "runtime",
    suffix: typeof registration !== "undefined" ? registration.scope : ""
  });
  function clientsClaim() {
    self.addEventListener("activate", () => self.clients.claim());
  }
  try {
    self["workbox:core:6.5.2"] && _();
  } catch (e) {
  }
  const fallback$2 = (code, ...args) => {
    let msg = code;
    if (args.length > 0) {
      msg += ` :: ${JSON.stringify(args)}`;
    }
    return msg;
  };
  const messageGenerator$2 = fallback$2;
  let WorkboxError$2 = class WorkboxError extends Error {
    constructor(errorCode, details) {
      const message = messageGenerator$2(errorCode, details);
      super(message);
      this.name = errorCode;
      this.details = details;
    }
  };
  function dontWaitFor(promise) {
    void promise.then(() => {
    });
  }
  const instanceOfAny = (object, constructors) => constructors.some((c) => object instanceof c);
  let idbProxyableTypes;
  let cursorAdvanceMethods;
  function getIdbProxyableTypes() {
    return idbProxyableTypes || (idbProxyableTypes = [
      IDBDatabase,
      IDBObjectStore,
      IDBIndex,
      IDBCursor,
      IDBTransaction
    ]);
  }
  function getCursorAdvanceMethods() {
    return cursorAdvanceMethods || (cursorAdvanceMethods = [
      IDBCursor.prototype.advance,
      IDBCursor.prototype.continue,
      IDBCursor.prototype.continuePrimaryKey
    ]);
  }
  const cursorRequestMap = /* @__PURE__ */ new WeakMap();
  const transactionDoneMap = /* @__PURE__ */ new WeakMap();
  const transactionStoreNamesMap = /* @__PURE__ */ new WeakMap();
  const transformCache = /* @__PURE__ */ new WeakMap();
  const reverseTransformCache = /* @__PURE__ */ new WeakMap();
  function promisifyRequest(request) {
    const promise = new Promise((resolve, reject) => {
      const unlisten = () => {
        request.removeEventListener("success", success);
        request.removeEventListener("error", error);
      };
      const success = () => {
        resolve(wrap(request.result));
        unlisten();
      };
      const error = () => {
        reject(request.error);
        unlisten();
      };
      request.addEventListener("success", success);
      request.addEventListener("error", error);
    });
    promise.then((value) => {
      if (value instanceof IDBCursor) {
        cursorRequestMap.set(value, request);
      }
    }).catch(() => {
    });
    reverseTransformCache.set(promise, request);
    return promise;
  }
  function cacheDonePromiseForTransaction(tx) {
    if (transactionDoneMap.has(tx))
      return;
    const done = new Promise((resolve, reject) => {
      const unlisten = () => {
        tx.removeEventListener("complete", complete);
        tx.removeEventListener("error", error);
        tx.removeEventListener("abort", error);
      };
      const complete = () => {
        resolve();
        unlisten();
      };
      const error = () => {
        reject(tx.error || new DOMException("AbortError", "AbortError"));
        unlisten();
      };
      tx.addEventListener("complete", complete);
      tx.addEventListener("error", error);
      tx.addEventListener("abort", error);
    });
    transactionDoneMap.set(tx, done);
  }
  let idbProxyTraps = {
    get(target, prop, receiver) {
      if (target instanceof IDBTransaction) {
        if (prop === "done")
          return transactionDoneMap.get(target);
        if (prop === "objectStoreNames") {
          return target.objectStoreNames || transactionStoreNamesMap.get(target);
        }
        if (prop === "store") {
          return receiver.objectStoreNames[1] ? void 0 : receiver.objectStore(receiver.objectStoreNames[0]);
        }
      }
      return wrap(target[prop]);
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
    has(target, prop) {
      if (target instanceof IDBTransaction && (prop === "done" || prop === "store")) {
        return true;
      }
      return prop in target;
    }
  };
  function replaceTraps(callback) {
    idbProxyTraps = callback(idbProxyTraps);
  }
  function wrapFunction(func) {
    if (func === IDBDatabase.prototype.transaction && !("objectStoreNames" in IDBTransaction.prototype)) {
      return function(storeNames, ...args) {
        const tx = func.call(unwrap(this), storeNames, ...args);
        transactionStoreNamesMap.set(tx, storeNames.sort ? storeNames.sort() : [storeNames]);
        return wrap(tx);
      };
    }
    if (getCursorAdvanceMethods().includes(func)) {
      return function(...args) {
        func.apply(unwrap(this), args);
        return wrap(cursorRequestMap.get(this));
      };
    }
    return function(...args) {
      return wrap(func.apply(unwrap(this), args));
    };
  }
  function transformCachableValue(value) {
    if (typeof value === "function")
      return wrapFunction(value);
    if (value instanceof IDBTransaction)
      cacheDonePromiseForTransaction(value);
    if (instanceOfAny(value, getIdbProxyableTypes()))
      return new Proxy(value, idbProxyTraps);
    return value;
  }
  function wrap(value) {
    if (value instanceof IDBRequest)
      return promisifyRequest(value);
    if (transformCache.has(value))
      return transformCache.get(value);
    const newValue = transformCachableValue(value);
    if (newValue !== value) {
      transformCache.set(value, newValue);
      reverseTransformCache.set(newValue, value);
    }
    return newValue;
  }
  const unwrap = (value) => reverseTransformCache.get(value);
  function openDB(name, version, { blocked, upgrade, blocking, terminated } = {}) {
    const request = indexedDB.open(name, version);
    const openPromise = wrap(request);
    if (upgrade) {
      request.addEventListener("upgradeneeded", (event) => {
        upgrade(wrap(request.result), event.oldVersion, event.newVersion, wrap(request.transaction));
      });
    }
    if (blocked)
      request.addEventListener("blocked", () => blocked());
    openPromise.then((db) => {
      if (terminated)
        db.addEventListener("close", () => terminated());
      if (blocking)
        db.addEventListener("versionchange", () => blocking());
    }).catch(() => {
    });
    return openPromise;
  }
  function deleteDB(name, { blocked } = {}) {
    const request = indexedDB.deleteDatabase(name);
    if (blocked)
      request.addEventListener("blocked", () => blocked());
    return wrap(request).then(() => void 0);
  }
  const readMethods = ["get", "getKey", "getAll", "getAllKeys", "count"];
  const writeMethods = ["put", "add", "delete", "clear"];
  const cachedMethods = /* @__PURE__ */ new Map();
  function getMethod(target, prop) {
    if (!(target instanceof IDBDatabase && !(prop in target) && typeof prop === "string")) {
      return;
    }
    if (cachedMethods.get(prop))
      return cachedMethods.get(prop);
    const targetFuncName = prop.replace(/FromIndex$/, "");
    const useIndex = prop !== targetFuncName;
    const isWrite = writeMethods.includes(targetFuncName);
    if (!(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) || !(isWrite || readMethods.includes(targetFuncName))) {
      return;
    }
    const method = async function(storeName, ...args) {
      const tx = this.transaction(storeName, isWrite ? "readwrite" : "readonly");
      let target2 = tx.store;
      if (useIndex)
        target2 = target2.index(args.shift());
      return (await Promise.all([
        target2[targetFuncName](...args),
        isWrite && tx.done
      ]))[0];
    };
    cachedMethods.set(prop, method);
    return method;
  }
  replaceTraps((oldTraps) => ({
    ...oldTraps,
    get: (target, prop, receiver) => getMethod(target, prop) || oldTraps.get(target, prop, receiver),
    has: (target, prop) => !!getMethod(target, prop) || oldTraps.has(target, prop)
  }));
  try {
    self["workbox:expiration:6.5.2"] && _();
  } catch (e) {
  }
  const DB_NAME = "workbox-expiration";
  const CACHE_OBJECT_STORE = "cache-entries";
  const normalizeURL = (unNormalizedUrl) => {
    const url = new URL(unNormalizedUrl, location.href);
    url.hash = "";
    return url.href;
  };
  class CacheTimestampsModel {
    constructor(cacheName) {
      this._db = null;
      this._cacheName = cacheName;
    }
    _upgradeDb(db) {
      const objStore = db.createObjectStore(CACHE_OBJECT_STORE, { keyPath: "id" });
      objStore.createIndex("cacheName", "cacheName", { unique: false });
      objStore.createIndex("timestamp", "timestamp", { unique: false });
    }
    _upgradeDbAndDeleteOldDbs(db) {
      this._upgradeDb(db);
      if (this._cacheName) {
        void deleteDB(this._cacheName);
      }
    }
    async setTimestamp(url, timestamp) {
      url = normalizeURL(url);
      const entry = {
        url,
        timestamp,
        cacheName: this._cacheName,
        id: this._getId(url)
      };
      const db = await this.getDb();
      const tx = db.transaction(CACHE_OBJECT_STORE, "readwrite", {
        durability: "relaxed"
      });
      await tx.store.put(entry);
      await tx.done;
    }
    async getTimestamp(url) {
      const db = await this.getDb();
      const entry = await db.get(CACHE_OBJECT_STORE, this._getId(url));
      return entry === null || entry === void 0 ? void 0 : entry.timestamp;
    }
    async expireEntries(minTimestamp, maxCount) {
      const db = await this.getDb();
      let cursor = await db.transaction(CACHE_OBJECT_STORE).store.index("timestamp").openCursor(null, "prev");
      const entriesToDelete = [];
      let entriesNotDeletedCount = 0;
      while (cursor) {
        const result = cursor.value;
        if (result.cacheName === this._cacheName) {
          if (minTimestamp && result.timestamp < minTimestamp || maxCount && entriesNotDeletedCount >= maxCount) {
            entriesToDelete.push(cursor.value);
          } else {
            entriesNotDeletedCount++;
          }
        }
        cursor = await cursor.continue();
      }
      const urlsDeleted = [];
      for (const entry of entriesToDelete) {
        await db.delete(CACHE_OBJECT_STORE, entry.id);
        urlsDeleted.push(entry.url);
      }
      return urlsDeleted;
    }
    _getId(url) {
      return this._cacheName + "|" + normalizeURL(url);
    }
    async getDb() {
      if (!this._db) {
        this._db = await openDB(DB_NAME, 1, {
          upgrade: this._upgradeDbAndDeleteOldDbs.bind(this)
        });
      }
      return this._db;
    }
  }
  class CacheExpiration {
    constructor(cacheName, config = {}) {
      this._isRunning = false;
      this._rerunRequested = false;
      this._maxEntries = config.maxEntries;
      this._maxAgeSeconds = config.maxAgeSeconds;
      this._matchOptions = config.matchOptions;
      this._cacheName = cacheName;
      this._timestampModel = new CacheTimestampsModel(cacheName);
    }
    async expireEntries() {
      if (this._isRunning) {
        this._rerunRequested = true;
        return;
      }
      this._isRunning = true;
      const minTimestamp = this._maxAgeSeconds ? Date.now() - this._maxAgeSeconds * 1e3 : 0;
      const urlsExpired = await this._timestampModel.expireEntries(minTimestamp, this._maxEntries);
      const cache = await self.caches.open(this._cacheName);
      for (const url of urlsExpired) {
        await cache.delete(url, this._matchOptions);
      }
      this._isRunning = false;
      if (this._rerunRequested) {
        this._rerunRequested = false;
        dontWaitFor(this.expireEntries());
      }
    }
    async updateTimestamp(url) {
      await this._timestampModel.setTimestamp(url, Date.now());
    }
    async isURLExpired(url) {
      if (!this._maxAgeSeconds) {
        return false;
      } else {
        const timestamp = await this._timestampModel.getTimestamp(url);
        const expireOlderThan = Date.now() - this._maxAgeSeconds * 1e3;
        return timestamp !== void 0 ? timestamp < expireOlderThan : true;
      }
    }
    async delete() {
      this._rerunRequested = false;
      await this._timestampModel.expireEntries(Infinity);
    }
  }
  const _cacheNameDetails$2 = {
    googleAnalytics: "googleAnalytics",
    precache: "precache-v2",
    prefix: "workbox",
    runtime: "runtime",
    suffix: typeof registration !== "undefined" ? registration.scope : ""
  };
  const _createCacheName$2 = (cacheName) => {
    return [_cacheNameDetails$2.prefix, cacheName, _cacheNameDetails$2.suffix].filter((value) => value && value.length > 0).join("-");
  };
  const eachCacheNameDetail$2 = (fn) => {
    for (const key of Object.keys(_cacheNameDetails$2)) {
      fn(key);
    }
  };
  const cacheNames$2 = {
    updateDetails: (details) => {
      eachCacheNameDetail$2((key) => {
        if (typeof details[key] === "string") {
          _cacheNameDetails$2[key] = details[key];
        }
      });
    },
    getGoogleAnalyticsName: (userCacheName) => {
      return userCacheName || _createCacheName$2(_cacheNameDetails$2.googleAnalytics);
    },
    getPrecacheName: (userCacheName) => {
      return userCacheName || _createCacheName$2(_cacheNameDetails$2.precache);
    },
    getPrefix: () => {
      return _cacheNameDetails$2.prefix;
    },
    getRuntimeName: (userCacheName) => {
      return userCacheName || _createCacheName$2(_cacheNameDetails$2.runtime);
    },
    getSuffix: () => {
      return _cacheNameDetails$2.suffix;
    }
  };
  const quotaErrorCallbacks$1 = /* @__PURE__ */ new Set();
  function registerQuotaErrorCallback(callback) {
    quotaErrorCallbacks$1.add(callback);
  }
  class ExpirationPlugin {
    constructor(config = {}) {
      this.cachedResponseWillBeUsed = async ({ event, request, cacheName, cachedResponse }) => {
        if (!cachedResponse) {
          return null;
        }
        const isFresh = this._isResponseDateFresh(cachedResponse);
        const cacheExpiration = this._getCacheExpiration(cacheName);
        dontWaitFor(cacheExpiration.expireEntries());
        const updateTimestampDone = cacheExpiration.updateTimestamp(request.url);
        if (event) {
          try {
            event.waitUntil(updateTimestampDone);
          } catch (error) {
          }
        }
        return isFresh ? cachedResponse : null;
      };
      this.cacheDidUpdate = async ({ cacheName, request }) => {
        const cacheExpiration = this._getCacheExpiration(cacheName);
        await cacheExpiration.updateTimestamp(request.url);
        await cacheExpiration.expireEntries();
      };
      this._config = config;
      this._maxAgeSeconds = config.maxAgeSeconds;
      this._cacheExpirations = /* @__PURE__ */ new Map();
      if (config.purgeOnQuotaError) {
        registerQuotaErrorCallback(() => this.deleteCacheAndMetadata());
      }
    }
    _getCacheExpiration(cacheName) {
      if (cacheName === cacheNames$2.getRuntimeName()) {
        throw new WorkboxError$2("expire-custom-caches-only");
      }
      let cacheExpiration = this._cacheExpirations.get(cacheName);
      if (!cacheExpiration) {
        cacheExpiration = new CacheExpiration(cacheName, this._config);
        this._cacheExpirations.set(cacheName, cacheExpiration);
      }
      return cacheExpiration;
    }
    _isResponseDateFresh(cachedResponse) {
      if (!this._maxAgeSeconds) {
        return true;
      }
      const dateHeaderTimestamp = this._getDateHeaderTimestamp(cachedResponse);
      if (dateHeaderTimestamp === null) {
        return true;
      }
      const now = Date.now();
      return dateHeaderTimestamp >= now - this._maxAgeSeconds * 1e3;
    }
    _getDateHeaderTimestamp(cachedResponse) {
      if (!cachedResponse.headers.has("date")) {
        return null;
      }
      const dateHeader = cachedResponse.headers.get("date");
      const parsedDate = new Date(dateHeader);
      const headerTime = parsedDate.getTime();
      if (isNaN(headerTime)) {
        return null;
      }
      return headerTime;
    }
    async deleteCacheAndMetadata() {
      for (const [cacheName, cacheExpiration] of this._cacheExpirations) {
        await self.caches.delete(cacheName);
        await cacheExpiration.delete();
      }
      this._cacheExpirations = /* @__PURE__ */ new Map();
    }
  }
  try {
    self["workbox:core:6.5.2"] && _();
  } catch (e) {
  }
  const fallback$1 = (code, ...args) => {
    let msg = code;
    if (args.length > 0) {
      msg += ` :: ${JSON.stringify(args)}`;
    }
    return msg;
  };
  const messageGenerator$1 = fallback$1;
  let WorkboxError$1 = class WorkboxError extends Error {
    constructor(errorCode, details) {
      const message = messageGenerator$1(errorCode, details);
      super(message);
      this.name = errorCode;
      this.details = details;
    }
  };
  const _cacheNameDetails$1 = {
    googleAnalytics: "googleAnalytics",
    precache: "precache-v2",
    prefix: "workbox",
    runtime: "runtime",
    suffix: typeof registration !== "undefined" ? registration.scope : ""
  };
  const _createCacheName$1 = (cacheName) => {
    return [_cacheNameDetails$1.prefix, cacheName, _cacheNameDetails$1.suffix].filter((value) => value && value.length > 0).join("-");
  };
  const eachCacheNameDetail$1 = (fn) => {
    for (const key of Object.keys(_cacheNameDetails$1)) {
      fn(key);
    }
  };
  const cacheNames$1 = {
    updateDetails: (details) => {
      eachCacheNameDetail$1((key) => {
        if (typeof details[key] === "string") {
          _cacheNameDetails$1[key] = details[key];
        }
      });
    },
    getGoogleAnalyticsName: (userCacheName) => {
      return userCacheName || _createCacheName$1(_cacheNameDetails$1.googleAnalytics);
    },
    getPrecacheName: (userCacheName) => {
      return userCacheName || _createCacheName$1(_cacheNameDetails$1.precache);
    },
    getPrefix: () => {
      return _cacheNameDetails$1.prefix;
    },
    getRuntimeName: (userCacheName) => {
      return userCacheName || _createCacheName$1(_cacheNameDetails$1.runtime);
    },
    getSuffix: () => {
      return _cacheNameDetails$1.suffix;
    }
  };
  function waitUntil(event, asyncFn) {
    const returnPromise = asyncFn();
    event.waitUntil(returnPromise);
    return returnPromise;
  }
  try {
    self["workbox:precaching:6.5.2"] && _();
  } catch (e) {
  }
  const REVISION_SEARCH_PARAM = "__WB_REVISION__";
  function createCacheKey(entry) {
    if (!entry) {
      throw new WorkboxError$1("add-to-cache-list-unexpected-type", { entry });
    }
    if (typeof entry === "string") {
      const urlObject = new URL(entry, location.href);
      return {
        cacheKey: urlObject.href,
        url: urlObject.href
      };
    }
    const { revision, url } = entry;
    if (!url) {
      throw new WorkboxError$1("add-to-cache-list-unexpected-type", { entry });
    }
    if (!revision) {
      const urlObject = new URL(url, location.href);
      return {
        cacheKey: urlObject.href,
        url: urlObject.href
      };
    }
    const cacheKeyURL = new URL(url, location.href);
    const originalURL = new URL(url, location.href);
    cacheKeyURL.searchParams.set(REVISION_SEARCH_PARAM, revision);
    return {
      cacheKey: cacheKeyURL.href,
      url: originalURL.href
    };
  }
  class PrecacheInstallReportPlugin {
    constructor() {
      this.updatedURLs = [];
      this.notUpdatedURLs = [];
      this.handlerWillStart = async ({ request, state }) => {
        if (state) {
          state.originalRequest = request;
        }
      };
      this.cachedResponseWillBeUsed = async ({ event, state, cachedResponse }) => {
        if (event.type === "install") {
          if (state && state.originalRequest && state.originalRequest instanceof Request) {
            const url = state.originalRequest.url;
            if (cachedResponse) {
              this.notUpdatedURLs.push(url);
            } else {
              this.updatedURLs.push(url);
            }
          }
        }
        return cachedResponse;
      };
    }
  }
  class PrecacheCacheKeyPlugin {
    constructor({ precacheController: precacheController2 }) {
      this.cacheKeyWillBeUsed = async ({ request, params }) => {
        const cacheKey = (params === null || params === void 0 ? void 0 : params.cacheKey) || this._precacheController.getCacheKeyForURL(request.url);
        return cacheKey ? new Request(cacheKey, { headers: request.headers }) : request;
      };
      this._precacheController = precacheController2;
    }
  }
  let supportStatus;
  function canConstructResponseFromBodyStream() {
    if (supportStatus === void 0) {
      const testResponse = new Response("");
      if ("body" in testResponse) {
        try {
          new Response(testResponse.body);
          supportStatus = true;
        } catch (error) {
          supportStatus = false;
        }
      }
      supportStatus = false;
    }
    return supportStatus;
  }
  async function copyResponse(response, modifier) {
    let origin = null;
    if (response.url) {
      const responseURL = new URL(response.url);
      origin = responseURL.origin;
    }
    if (origin !== self.location.origin) {
      throw new WorkboxError$1("cross-origin-copy-response", { origin });
    }
    const clonedResponse = response.clone();
    const responseInit = {
      headers: new Headers(clonedResponse.headers),
      status: clonedResponse.status,
      statusText: clonedResponse.statusText
    };
    const modifiedResponseInit = modifier ? modifier(responseInit) : responseInit;
    const body = canConstructResponseFromBodyStream() ? clonedResponse.body : await clonedResponse.blob();
    return new Response(body, modifiedResponseInit);
  }
  try {
    self["workbox:core:6.5.2"] && _();
  } catch (e) {
  }
  const _cacheNameDetails = {
    googleAnalytics: "googleAnalytics",
    precache: "precache-v2",
    prefix: "workbox",
    runtime: "runtime",
    suffix: typeof registration !== "undefined" ? registration.scope : ""
  };
  const _createCacheName = (cacheName) => {
    return [_cacheNameDetails.prefix, cacheName, _cacheNameDetails.suffix].filter((value) => value && value.length > 0).join("-");
  };
  const eachCacheNameDetail = (fn) => {
    for (const key of Object.keys(_cacheNameDetails)) {
      fn(key);
    }
  };
  const cacheNames = {
    updateDetails: (details) => {
      eachCacheNameDetail((key) => {
        if (typeof details[key] === "string") {
          _cacheNameDetails[key] = details[key];
        }
      });
    },
    getGoogleAnalyticsName: (userCacheName) => {
      return userCacheName || _createCacheName(_cacheNameDetails.googleAnalytics);
    },
    getPrecacheName: (userCacheName) => {
      return userCacheName || _createCacheName(_cacheNameDetails.precache);
    },
    getPrefix: () => {
      return _cacheNameDetails.prefix;
    },
    getRuntimeName: (userCacheName) => {
      return userCacheName || _createCacheName(_cacheNameDetails.runtime);
    },
    getSuffix: () => {
      return _cacheNameDetails.suffix;
    }
  };
  const fallback = (code, ...args) => {
    let msg = code;
    if (args.length > 0) {
      msg += ` :: ${JSON.stringify(args)}`;
    }
    return msg;
  };
  const messageGenerator = fallback;
  class WorkboxError extends Error {
    constructor(errorCode, details) {
      const message = messageGenerator(errorCode, details);
      super(message);
      this.name = errorCode;
      this.details = details;
    }
  }
  const logger$1 = null;
  const getFriendlyURL = (url) => {
    const urlObj = new URL(String(url), location.href);
    return urlObj.href.replace(new RegExp(`^${location.origin}`), "");
  };
  function stripParams(fullURL, ignoreParams) {
    const strippedURL = new URL(fullURL);
    for (const param of ignoreParams) {
      strippedURL.searchParams.delete(param);
    }
    return strippedURL.href;
  }
  async function cacheMatchIgnoreParams(cache, request, ignoreParams, matchOptions) {
    const strippedRequestURL = stripParams(request.url, ignoreParams);
    if (request.url === strippedRequestURL) {
      return cache.match(request, matchOptions);
    }
    const keysOptions = Object.assign(Object.assign({}, matchOptions), { ignoreSearch: true });
    const cacheKeys = await cache.keys(request, keysOptions);
    for (const cacheKey of cacheKeys) {
      const strippedCacheKeyURL = stripParams(cacheKey.url, ignoreParams);
      if (strippedRequestURL === strippedCacheKeyURL) {
        return cache.match(cacheKey, matchOptions);
      }
    }
    return;
  }
  class Deferred {
    constructor() {
      this.promise = new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
    }
  }
  const quotaErrorCallbacks = /* @__PURE__ */ new Set();
  async function executeQuotaErrorCallbacks() {
    for (const callback of quotaErrorCallbacks) {
      await callback();
    }
  }
  function timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  try {
    self["workbox:strategies:6.5.2"] && _();
  } catch (e) {
  }
  function toRequest(input) {
    return typeof input === "string" ? new Request(input) : input;
  }
  class StrategyHandler {
    constructor(strategy, options) {
      this._cacheKeys = {};
      Object.assign(this, options);
      this.event = options.event;
      this._strategy = strategy;
      this._handlerDeferred = new Deferred();
      this._extendLifetimePromises = [];
      this._plugins = [...strategy.plugins];
      this._pluginStateMap = /* @__PURE__ */ new Map();
      for (const plugin of this._plugins) {
        this._pluginStateMap.set(plugin, {});
      }
      this.event.waitUntil(this._handlerDeferred.promise);
    }
    async fetch(input) {
      const { event } = this;
      let request = toRequest(input);
      if (request.mode === "navigate" && event instanceof FetchEvent && event.preloadResponse) {
        const possiblePreloadResponse = await event.preloadResponse;
        if (possiblePreloadResponse) {
          return possiblePreloadResponse;
        }
      }
      const originalRequest = this.hasCallback("fetchDidFail") ? request.clone() : null;
      try {
        for (const cb of this.iterateCallbacks("requestWillFetch")) {
          request = await cb({ request: request.clone(), event });
        }
      } catch (err) {
        if (err instanceof Error) {
          throw new WorkboxError("plugin-error-request-will-fetch", {
            thrownErrorMessage: err.message
          });
        }
      }
      const pluginFilteredRequest = request.clone();
      try {
        let fetchResponse;
        fetchResponse = await fetch(request, request.mode === "navigate" ? void 0 : this._strategy.fetchOptions);
        if (false)
          ;
        for (const callback of this.iterateCallbacks("fetchDidSucceed")) {
          fetchResponse = await callback({
            event,
            request: pluginFilteredRequest,
            response: fetchResponse
          });
        }
        return fetchResponse;
      } catch (error) {
        if (originalRequest) {
          await this.runCallbacks("fetchDidFail", {
            error,
            event,
            originalRequest: originalRequest.clone(),
            request: pluginFilteredRequest.clone()
          });
        }
        throw error;
      }
    }
    async fetchAndCachePut(input) {
      const response = await this.fetch(input);
      const responseClone = response.clone();
      void this.waitUntil(this.cachePut(input, responseClone));
      return response;
    }
    async cacheMatch(key) {
      const request = toRequest(key);
      let cachedResponse;
      const { cacheName, matchOptions } = this._strategy;
      const effectiveRequest = await this.getCacheKey(request, "read");
      const multiMatchOptions = Object.assign(Object.assign({}, matchOptions), { cacheName });
      cachedResponse = await caches.match(effectiveRequest, multiMatchOptions);
      for (const callback of this.iterateCallbacks("cachedResponseWillBeUsed")) {
        cachedResponse = await callback({
          cacheName,
          matchOptions,
          cachedResponse,
          request: effectiveRequest,
          event: this.event
        }) || void 0;
      }
      return cachedResponse;
    }
    async cachePut(key, response) {
      const request = toRequest(key);
      await timeout(0);
      const effectiveRequest = await this.getCacheKey(request, "write");
      if (!response) {
        throw new WorkboxError("cache-put-with-no-response", {
          url: getFriendlyURL(effectiveRequest.url)
        });
      }
      const responseToCache = await this._ensureResponseSafeToCache(response);
      if (!responseToCache) {
        return false;
      }
      const { cacheName, matchOptions } = this._strategy;
      const cache = await self.caches.open(cacheName);
      const hasCacheUpdateCallback = this.hasCallback("cacheDidUpdate");
      const oldResponse = hasCacheUpdateCallback ? await cacheMatchIgnoreParams(
        cache,
        effectiveRequest.clone(),
        ["__WB_REVISION__"],
        matchOptions
      ) : null;
      try {
        await cache.put(effectiveRequest, hasCacheUpdateCallback ? responseToCache.clone() : responseToCache);
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === "QuotaExceededError") {
            await executeQuotaErrorCallbacks();
          }
          throw error;
        }
      }
      for (const callback of this.iterateCallbacks("cacheDidUpdate")) {
        await callback({
          cacheName,
          oldResponse,
          newResponse: responseToCache.clone(),
          request: effectiveRequest,
          event: this.event
        });
      }
      return true;
    }
    async getCacheKey(request, mode) {
      const key = `${request.url} | ${mode}`;
      if (!this._cacheKeys[key]) {
        let effectiveRequest = request;
        for (const callback of this.iterateCallbacks("cacheKeyWillBeUsed")) {
          effectiveRequest = toRequest(await callback({
            mode,
            request: effectiveRequest,
            event: this.event,
            params: this.params
          }));
        }
        this._cacheKeys[key] = effectiveRequest;
      }
      return this._cacheKeys[key];
    }
    hasCallback(name) {
      for (const plugin of this._strategy.plugins) {
        if (name in plugin) {
          return true;
        }
      }
      return false;
    }
    async runCallbacks(name, param) {
      for (const callback of this.iterateCallbacks(name)) {
        await callback(param);
      }
    }
    *iterateCallbacks(name) {
      for (const plugin of this._strategy.plugins) {
        if (typeof plugin[name] === "function") {
          const state = this._pluginStateMap.get(plugin);
          const statefulCallback = (param) => {
            const statefulParam = Object.assign(Object.assign({}, param), { state });
            return plugin[name](statefulParam);
          };
          yield statefulCallback;
        }
      }
    }
    waitUntil(promise) {
      this._extendLifetimePromises.push(promise);
      return promise;
    }
    async doneWaiting() {
      let promise;
      while (promise = this._extendLifetimePromises.shift()) {
        await promise;
      }
    }
    destroy() {
      this._handlerDeferred.resolve(null);
    }
    async _ensureResponseSafeToCache(response) {
      let responseToCache = response;
      let pluginsUsed = false;
      for (const callback of this.iterateCallbacks("cacheWillUpdate")) {
        responseToCache = await callback({
          request: this.request,
          response: responseToCache,
          event: this.event
        }) || void 0;
        pluginsUsed = true;
        if (!responseToCache) {
          break;
        }
      }
      if (!pluginsUsed) {
        if (responseToCache && responseToCache.status !== 200) {
          responseToCache = void 0;
        }
      }
      return responseToCache;
    }
  }
  class Strategy {
    constructor(options = {}) {
      this.cacheName = cacheNames.getRuntimeName(options.cacheName);
      this.plugins = options.plugins || [];
      this.fetchOptions = options.fetchOptions;
      this.matchOptions = options.matchOptions;
    }
    handle(options) {
      const [responseDone] = this.handleAll(options);
      return responseDone;
    }
    handleAll(options) {
      if (options instanceof FetchEvent) {
        options = {
          event: options,
          request: options.request
        };
      }
      const event = options.event;
      const request = typeof options.request === "string" ? new Request(options.request) : options.request;
      const params = "params" in options ? options.params : void 0;
      const handler = new StrategyHandler(this, { event, request, params });
      const responseDone = this._getResponse(handler, request, event);
      const handlerDone = this._awaitComplete(responseDone, handler, request, event);
      return [responseDone, handlerDone];
    }
    async _getResponse(handler, request, event) {
      await handler.runCallbacks("handlerWillStart", { event, request });
      let response = void 0;
      try {
        response = await this._handle(request, handler);
        if (!response || response.type === "error") {
          throw new WorkboxError("no-response", { url: request.url });
        }
      } catch (error) {
        if (error instanceof Error) {
          for (const callback of handler.iterateCallbacks("handlerDidError")) {
            response = await callback({ error, event, request });
            if (response) {
              break;
            }
          }
        }
        if (!response) {
          throw error;
        }
      }
      for (const callback of handler.iterateCallbacks("handlerWillRespond")) {
        response = await callback({ event, request, response });
      }
      return response;
    }
    async _awaitComplete(responseDone, handler, request, event) {
      let response;
      let error;
      try {
        response = await responseDone;
      } catch (error2) {
      }
      try {
        await handler.runCallbacks("handlerDidRespond", {
          event,
          request,
          response
        });
        await handler.doneWaiting();
      } catch (waitUntilError) {
        if (waitUntilError instanceof Error) {
          error = waitUntilError;
        }
      }
      await handler.runCallbacks("handlerDidComplete", {
        event,
        request,
        response,
        error
      });
      handler.destroy();
      if (error) {
        throw error;
      }
    }
  }
  class PrecacheStrategy extends Strategy {
    constructor(options = {}) {
      options.cacheName = cacheNames$1.getPrecacheName(options.cacheName);
      super(options);
      this._fallbackToNetwork = options.fallbackToNetwork === false ? false : true;
      this.plugins.push(PrecacheStrategy.copyRedirectedCacheableResponsesPlugin);
    }
    async _handle(request, handler) {
      const response = await handler.cacheMatch(request);
      if (response) {
        return response;
      }
      if (handler.event && handler.event.type === "install") {
        return await this._handleInstall(request, handler);
      }
      return await this._handleFetch(request, handler);
    }
    async _handleFetch(request, handler) {
      let response;
      const params = handler.params || {};
      if (this._fallbackToNetwork) {
        const integrityInManifest = params.integrity;
        const integrityInRequest = request.integrity;
        const noIntegrityConflict = !integrityInRequest || integrityInRequest === integrityInManifest;
        response = await handler.fetch(new Request(request, {
          integrity: integrityInRequest || integrityInManifest
        }));
        if (integrityInManifest && noIntegrityConflict) {
          this._useDefaultCacheabilityPluginIfNeeded();
          await handler.cachePut(request, response.clone());
        }
      } else {
        throw new WorkboxError$1("missing-precache-entry", {
          cacheName: this.cacheName,
          url: request.url
        });
      }
      return response;
    }
    async _handleInstall(request, handler) {
      this._useDefaultCacheabilityPluginIfNeeded();
      const response = await handler.fetch(request);
      const wasCached = await handler.cachePut(request, response.clone());
      if (!wasCached) {
        throw new WorkboxError$1("bad-precaching-response", {
          url: request.url,
          status: response.status
        });
      }
      return response;
    }
    _useDefaultCacheabilityPluginIfNeeded() {
      let defaultPluginIndex = null;
      let cacheWillUpdatePluginCount = 0;
      for (const [index, plugin] of this.plugins.entries()) {
        if (plugin === PrecacheStrategy.copyRedirectedCacheableResponsesPlugin) {
          continue;
        }
        if (plugin === PrecacheStrategy.defaultPrecacheCacheabilityPlugin) {
          defaultPluginIndex = index;
        }
        if (plugin.cacheWillUpdate) {
          cacheWillUpdatePluginCount++;
        }
      }
      if (cacheWillUpdatePluginCount === 0) {
        this.plugins.push(PrecacheStrategy.defaultPrecacheCacheabilityPlugin);
      } else if (cacheWillUpdatePluginCount > 1 && defaultPluginIndex !== null) {
        this.plugins.splice(defaultPluginIndex, 1);
      }
    }
  }
  PrecacheStrategy.defaultPrecacheCacheabilityPlugin = {
    async cacheWillUpdate({ response }) {
      if (!response || response.status >= 400) {
        return null;
      }
      return response;
    }
  };
  PrecacheStrategy.copyRedirectedCacheableResponsesPlugin = {
    async cacheWillUpdate({ response }) {
      return response.redirected ? await copyResponse(response) : response;
    }
  };
  class PrecacheController {
    constructor({ cacheName, plugins = [], fallbackToNetwork = true } = {}) {
      this._urlsToCacheKeys = /* @__PURE__ */ new Map();
      this._urlsToCacheModes = /* @__PURE__ */ new Map();
      this._cacheKeysToIntegrities = /* @__PURE__ */ new Map();
      this._strategy = new PrecacheStrategy({
        cacheName: cacheNames$1.getPrecacheName(cacheName),
        plugins: [
          ...plugins,
          new PrecacheCacheKeyPlugin({ precacheController: this })
        ],
        fallbackToNetwork
      });
      this.install = this.install.bind(this);
      this.activate = this.activate.bind(this);
    }
    get strategy() {
      return this._strategy;
    }
    precache(entries) {
      this.addToCacheList(entries);
      if (!this._installAndActiveListenersAdded) {
        self.addEventListener("install", this.install);
        self.addEventListener("activate", this.activate);
        this._installAndActiveListenersAdded = true;
      }
    }
    addToCacheList(entries) {
      const urlsToWarnAbout = [];
      for (const entry of entries) {
        if (typeof entry === "string") {
          urlsToWarnAbout.push(entry);
        } else if (entry && entry.revision === void 0) {
          urlsToWarnAbout.push(entry.url);
        }
        const { cacheKey, url } = createCacheKey(entry);
        const cacheMode = typeof entry !== "string" && entry.revision ? "reload" : "default";
        if (this._urlsToCacheKeys.has(url) && this._urlsToCacheKeys.get(url) !== cacheKey) {
          throw new WorkboxError$1("add-to-cache-list-conflicting-entries", {
            firstEntry: this._urlsToCacheKeys.get(url),
            secondEntry: cacheKey
          });
        }
        if (typeof entry !== "string" && entry.integrity) {
          if (this._cacheKeysToIntegrities.has(cacheKey) && this._cacheKeysToIntegrities.get(cacheKey) !== entry.integrity) {
            throw new WorkboxError$1("add-to-cache-list-conflicting-integrities", {
              url
            });
          }
          this._cacheKeysToIntegrities.set(cacheKey, entry.integrity);
        }
        this._urlsToCacheKeys.set(url, cacheKey);
        this._urlsToCacheModes.set(url, cacheMode);
        if (urlsToWarnAbout.length > 0) {
          const warningMessage = `Workbox is precaching URLs without revision info: ${urlsToWarnAbout.join(", ")}
This is generally NOT safe. Learn more at https://bit.ly/wb-precache`;
          {
            console.warn(warningMessage);
          }
        }
      }
    }
    install(event) {
      return waitUntil(event, async () => {
        const installReportPlugin = new PrecacheInstallReportPlugin();
        this.strategy.plugins.push(installReportPlugin);
        for (const [url, cacheKey] of this._urlsToCacheKeys) {
          const integrity = this._cacheKeysToIntegrities.get(cacheKey);
          const cacheMode = this._urlsToCacheModes.get(url);
          const request = new Request(url, {
            integrity,
            cache: cacheMode,
            credentials: "same-origin"
          });
          await Promise.all(this.strategy.handleAll({
            params: { cacheKey },
            request,
            event
          }));
        }
        const { updatedURLs, notUpdatedURLs } = installReportPlugin;
        return { updatedURLs, notUpdatedURLs };
      });
    }
    activate(event) {
      return waitUntil(event, async () => {
        const cache = await self.caches.open(this.strategy.cacheName);
        const currentlyCachedRequests = await cache.keys();
        const expectedCacheKeys = new Set(this._urlsToCacheKeys.values());
        const deletedURLs = [];
        for (const request of currentlyCachedRequests) {
          if (!expectedCacheKeys.has(request.url)) {
            await cache.delete(request);
            deletedURLs.push(request.url);
          }
        }
        return { deletedURLs };
      });
    }
    getURLsToCacheKeys() {
      return this._urlsToCacheKeys;
    }
    getCachedURLs() {
      return [...this._urlsToCacheKeys.keys()];
    }
    getCacheKeyForURL(url) {
      const urlObject = new URL(url, location.href);
      return this._urlsToCacheKeys.get(urlObject.href);
    }
    getIntegrityForCacheKey(cacheKey) {
      return this._cacheKeysToIntegrities.get(cacheKey);
    }
    async matchPrecache(request) {
      const url = request instanceof Request ? request.url : request;
      const cacheKey = this.getCacheKeyForURL(url);
      if (cacheKey) {
        const cache = await self.caches.open(this.strategy.cacheName);
        return cache.match(cacheKey);
      }
      return void 0;
    }
    createHandlerBoundToURL(url) {
      const cacheKey = this.getCacheKeyForURL(url);
      if (!cacheKey) {
        throw new WorkboxError$1("non-precached-url", { url });
      }
      return (options) => {
        options.request = new Request(url);
        options.params = Object.assign({ cacheKey }, options.params);
        return this.strategy.handle(options);
      };
    }
  }
  let precacheController;
  const getOrCreatePrecacheController = () => {
    if (!precacheController) {
      precacheController = new PrecacheController();
    }
    return precacheController;
  };
  try {
    self["workbox:routing:6.5.2"] && _();
  } catch (e) {
  }
  const defaultMethod$1 = "GET";
  const normalizeHandler$1 = (handler) => {
    if (handler && typeof handler === "object") {
      return handler;
    } else {
      return { handle: handler };
    }
  };
  let Route$1 = class Route {
    constructor(match, handler, method = defaultMethod$1) {
      this.handler = normalizeHandler$1(handler);
      this.match = match;
      this.method = method;
    }
    setCatchHandler(handler) {
      this.catchHandler = normalizeHandler$1(handler);
    }
  };
  let RegExpRoute$1 = class RegExpRoute extends Route$1 {
    constructor(regExp, handler, method) {
      const match = ({ url }) => {
        const result = regExp.exec(url.href);
        if (!result) {
          return;
        }
        if (url.origin !== location.origin && result.index !== 0) {
          return;
        }
        return result.slice(1);
      };
      super(match, handler, method);
    }
  };
  let Router$1 = class Router {
    constructor() {
      this._routes = /* @__PURE__ */ new Map();
      this._defaultHandlerMap = /* @__PURE__ */ new Map();
    }
    get routes() {
      return this._routes;
    }
    addFetchListener() {
      self.addEventListener("fetch", (event) => {
        const { request } = event;
        const responsePromise = this.handleRequest({ request, event });
        if (responsePromise) {
          event.respondWith(responsePromise);
        }
      });
    }
    addCacheListener() {
      self.addEventListener("message", (event) => {
        if (event.data && event.data.type === "CACHE_URLS") {
          const { payload } = event.data;
          const requestPromises = Promise.all(payload.urlsToCache.map((entry) => {
            if (typeof entry === "string") {
              entry = [entry];
            }
            const request = new Request(...entry);
            return this.handleRequest({ request, event });
          }));
          event.waitUntil(requestPromises);
          if (event.ports && event.ports[0]) {
            void requestPromises.then(() => event.ports[0].postMessage(true));
          }
        }
      });
    }
    handleRequest({ request, event }) {
      const url = new URL(request.url, location.href);
      if (!url.protocol.startsWith("http")) {
        return;
      }
      const sameOrigin = url.origin === location.origin;
      const { params, route } = this.findMatchingRoute({
        event,
        request,
        sameOrigin,
        url
      });
      let handler = route && route.handler;
      const method = request.method;
      if (!handler && this._defaultHandlerMap.has(method)) {
        handler = this._defaultHandlerMap.get(method);
      }
      if (!handler) {
        return;
      }
      let responsePromise;
      try {
        responsePromise = handler.handle({ url, request, event, params });
      } catch (err) {
        responsePromise = Promise.reject(err);
      }
      const catchHandler = route && route.catchHandler;
      if (responsePromise instanceof Promise && (this._catchHandler || catchHandler)) {
        responsePromise = responsePromise.catch(async (err) => {
          if (catchHandler) {
            try {
              return await catchHandler.handle({ url, request, event, params });
            } catch (catchErr) {
              if (catchErr instanceof Error) {
                err = catchErr;
              }
            }
          }
          if (this._catchHandler) {
            return this._catchHandler.handle({ url, request, event });
          }
          throw err;
        });
      }
      return responsePromise;
    }
    findMatchingRoute({ url, sameOrigin, request, event }) {
      const routes = this._routes.get(request.method) || [];
      for (const route of routes) {
        let params;
        const matchResult = route.match({ url, sameOrigin, request, event });
        if (matchResult) {
          params = matchResult;
          if (Array.isArray(params) && params.length === 0) {
            params = void 0;
          } else if (matchResult.constructor === Object && Object.keys(matchResult).length === 0) {
            params = void 0;
          } else if (typeof matchResult === "boolean") {
            params = void 0;
          }
          return { route, params };
        }
      }
      return {};
    }
    setDefaultHandler(handler, method = defaultMethod$1) {
      this._defaultHandlerMap.set(method, normalizeHandler$1(handler));
    }
    setCatchHandler(handler) {
      this._catchHandler = normalizeHandler$1(handler);
    }
    registerRoute(route) {
      if (!this._routes.has(route.method)) {
        this._routes.set(route.method, []);
      }
      this._routes.get(route.method).push(route);
    }
    unregisterRoute(route) {
      if (!this._routes.has(route.method)) {
        throw new WorkboxError$1("unregister-route-but-not-found-with-method", {
          method: route.method
        });
      }
      const routeIndex = this._routes.get(route.method).indexOf(route);
      if (routeIndex > -1) {
        this._routes.get(route.method).splice(routeIndex, 1);
      } else {
        throw new WorkboxError$1("unregister-route-route-not-registered");
      }
    }
  };
  let defaultRouter$1;
  const getOrCreateDefaultRouter$1 = () => {
    if (!defaultRouter$1) {
      defaultRouter$1 = new Router$1();
      defaultRouter$1.addFetchListener();
      defaultRouter$1.addCacheListener();
    }
    return defaultRouter$1;
  };
  function registerRoute$1(capture, handler, method) {
    let route;
    if (typeof capture === "string") {
      const captureUrl = new URL(capture, location.href);
      const matchCallback = ({ url }) => {
        return url.href === captureUrl.href;
      };
      route = new Route$1(matchCallback, handler, method);
    } else if (capture instanceof RegExp) {
      route = new RegExpRoute$1(capture, handler, method);
    } else if (typeof capture === "function") {
      route = new Route$1(capture, handler, method);
    } else if (capture instanceof Route$1) {
      route = capture;
    } else {
      throw new WorkboxError$1("unsupported-route-type", {
        moduleName: "workbox-routing",
        funcName: "registerRoute",
        paramName: "capture"
      });
    }
    const defaultRouter2 = getOrCreateDefaultRouter$1();
    defaultRouter2.registerRoute(route);
    return route;
  }
  function removeIgnoredSearchParams(urlObject, ignoreURLParametersMatching = []) {
    for (const paramName of [...urlObject.searchParams.keys()]) {
      if (ignoreURLParametersMatching.some((regExp) => regExp.test(paramName))) {
        urlObject.searchParams.delete(paramName);
      }
    }
    return urlObject;
  }
  function* generateURLVariations(url, { ignoreURLParametersMatching = [/^utm_/, /^fbclid$/], directoryIndex = "index.html", cleanURLs = true, urlManipulation } = {}) {
    const urlObject = new URL(url, location.href);
    urlObject.hash = "";
    yield urlObject.href;
    const urlWithoutIgnoredParams = removeIgnoredSearchParams(urlObject, ignoreURLParametersMatching);
    yield urlWithoutIgnoredParams.href;
    if (directoryIndex && urlWithoutIgnoredParams.pathname.endsWith("/")) {
      const directoryURL = new URL(urlWithoutIgnoredParams.href);
      directoryURL.pathname += directoryIndex;
      yield directoryURL.href;
    }
    if (cleanURLs) {
      const cleanURL = new URL(urlWithoutIgnoredParams.href);
      cleanURL.pathname += ".html";
      yield cleanURL.href;
    }
    if (urlManipulation) {
      const additionalURLs = urlManipulation({ url: urlObject });
      for (const urlToAttempt of additionalURLs) {
        yield urlToAttempt.href;
      }
    }
  }
  class PrecacheRoute extends Route$1 {
    constructor(precacheController2, options) {
      const match = ({ request }) => {
        const urlsToCacheKeys = precacheController2.getURLsToCacheKeys();
        for (const possibleURL of generateURLVariations(request.url, options)) {
          const cacheKey = urlsToCacheKeys.get(possibleURL);
          if (cacheKey) {
            const integrity = precacheController2.getIntegrityForCacheKey(cacheKey);
            return { cacheKey, integrity };
          }
        }
        return;
      };
      super(match, precacheController2.strategy);
    }
  }
  function addRoute(options) {
    const precacheController2 = getOrCreatePrecacheController();
    const precacheRoute = new PrecacheRoute(precacheController2, options);
    registerRoute$1(precacheRoute);
  }
  function createHandlerBoundToURL(url) {
    const precacheController2 = getOrCreatePrecacheController();
    return precacheController2.createHandlerBoundToURL(url);
  }
  function precache(entries) {
    const precacheController2 = getOrCreatePrecacheController();
    precacheController2.precache(entries);
  }
  function precacheAndRoute(entries, options) {
    precache(entries);
    addRoute(options);
  }
  try {
    self["workbox:routing:6.5.2"] && _();
  } catch (e) {
  }
  const defaultMethod = "GET";
  const normalizeHandler = (handler) => {
    if (handler && typeof handler === "object") {
      return handler;
    } else {
      return { handle: handler };
    }
  };
  class Route {
    constructor(match, handler, method = defaultMethod) {
      this.handler = normalizeHandler(handler);
      this.match = match;
      this.method = method;
    }
    setCatchHandler(handler) {
      this.catchHandler = normalizeHandler(handler);
    }
  }
  class RegExpRoute extends Route {
    constructor(regExp, handler, method) {
      const match = ({ url }) => {
        const result = regExp.exec(url.href);
        if (!result) {
          return;
        }
        if (url.origin !== location.origin && result.index !== 0) {
          return;
        }
        return result.slice(1);
      };
      super(match, handler, method);
    }
  }
  class Router {
    constructor() {
      this._routes = /* @__PURE__ */ new Map();
      this._defaultHandlerMap = /* @__PURE__ */ new Map();
    }
    get routes() {
      return this._routes;
    }
    addFetchListener() {
      self.addEventListener("fetch", (event) => {
        const { request } = event;
        const responsePromise = this.handleRequest({ request, event });
        if (responsePromise) {
          event.respondWith(responsePromise);
        }
      });
    }
    addCacheListener() {
      self.addEventListener("message", (event) => {
        if (event.data && event.data.type === "CACHE_URLS") {
          const { payload } = event.data;
          const requestPromises = Promise.all(payload.urlsToCache.map((entry) => {
            if (typeof entry === "string") {
              entry = [entry];
            }
            const request = new Request(...entry);
            return this.handleRequest({ request, event });
          }));
          event.waitUntil(requestPromises);
          if (event.ports && event.ports[0]) {
            void requestPromises.then(() => event.ports[0].postMessage(true));
          }
        }
      });
    }
    handleRequest({ request, event }) {
      const url = new URL(request.url, location.href);
      if (!url.protocol.startsWith("http")) {
        return;
      }
      const sameOrigin = url.origin === location.origin;
      const { params, route } = this.findMatchingRoute({
        event,
        request,
        sameOrigin,
        url
      });
      let handler = route && route.handler;
      const method = request.method;
      if (!handler && this._defaultHandlerMap.has(method)) {
        handler = this._defaultHandlerMap.get(method);
      }
      if (!handler) {
        return;
      }
      let responsePromise;
      try {
        responsePromise = handler.handle({ url, request, event, params });
      } catch (err) {
        responsePromise = Promise.reject(err);
      }
      const catchHandler = route && route.catchHandler;
      if (responsePromise instanceof Promise && (this._catchHandler || catchHandler)) {
        responsePromise = responsePromise.catch(async (err) => {
          if (catchHandler) {
            try {
              return await catchHandler.handle({ url, request, event, params });
            } catch (catchErr) {
              if (catchErr instanceof Error) {
                err = catchErr;
              }
            }
          }
          if (this._catchHandler) {
            return this._catchHandler.handle({ url, request, event });
          }
          throw err;
        });
      }
      return responsePromise;
    }
    findMatchingRoute({ url, sameOrigin, request, event }) {
      const routes = this._routes.get(request.method) || [];
      for (const route of routes) {
        let params;
        const matchResult = route.match({ url, sameOrigin, request, event });
        if (matchResult) {
          params = matchResult;
          if (Array.isArray(params) && params.length === 0) {
            params = void 0;
          } else if (matchResult.constructor === Object && Object.keys(matchResult).length === 0) {
            params = void 0;
          } else if (typeof matchResult === "boolean") {
            params = void 0;
          }
          return { route, params };
        }
      }
      return {};
    }
    setDefaultHandler(handler, method = defaultMethod) {
      this._defaultHandlerMap.set(method, normalizeHandler(handler));
    }
    setCatchHandler(handler) {
      this._catchHandler = normalizeHandler(handler);
    }
    registerRoute(route) {
      if (!this._routes.has(route.method)) {
        this._routes.set(route.method, []);
      }
      this._routes.get(route.method).push(route);
    }
    unregisterRoute(route) {
      if (!this._routes.has(route.method)) {
        throw new WorkboxError$3("unregister-route-but-not-found-with-method", {
          method: route.method
        });
      }
      const routeIndex = this._routes.get(route.method).indexOf(route);
      if (routeIndex > -1) {
        this._routes.get(route.method).splice(routeIndex, 1);
      } else {
        throw new WorkboxError$3("unregister-route-route-not-registered");
      }
    }
  }
  let defaultRouter;
  const getOrCreateDefaultRouter = () => {
    if (!defaultRouter) {
      defaultRouter = new Router();
      defaultRouter.addFetchListener();
      defaultRouter.addCacheListener();
    }
    return defaultRouter;
  };
  function registerRoute(capture, handler, method) {
    let route;
    if (typeof capture === "string") {
      const captureUrl = new URL(capture, location.href);
      const matchCallback = ({ url }) => {
        return url.href === captureUrl.href;
      };
      route = new Route(matchCallback, handler, method);
    } else if (capture instanceof RegExp) {
      route = new RegExpRoute(capture, handler, method);
    } else if (typeof capture === "function") {
      route = new Route(capture, handler, method);
    } else if (capture instanceof Route) {
      route = capture;
    } else {
      throw new WorkboxError$3("unsupported-route-type", {
        moduleName: "workbox-routing",
        funcName: "registerRoute",
        paramName: "capture"
      });
    }
    const defaultRouter2 = getOrCreateDefaultRouter();
    defaultRouter2.registerRoute(route);
    return route;
  }
  const cacheOkAndOpaquePlugin = {
    cacheWillUpdate: async ({ response }) => {
      if (response.status === 200 || response.status === 0) {
        return response;
      }
      return null;
    }
  };
  class StaleWhileRevalidate extends Strategy {
    constructor(options = {}) {
      super(options);
      if (!this.plugins.some((p) => "cacheWillUpdate" in p)) {
        this.plugins.unshift(cacheOkAndOpaquePlugin);
      }
    }
    async _handle(request, handler) {
      const fetchAndCachePromise = handler.fetchAndCachePut(request).catch(() => {
      });
      void handler.waitUntil(fetchAndCachePromise);
      let response = await handler.cacheMatch(request);
      let error;
      if (response)
        ;
      else {
        try {
          response = await fetchAndCachePromise;
        } catch (err) {
          if (err instanceof Error) {
            error = err;
          }
        }
      }
      if (!response) {
        throw new WorkboxError("no-response", { url: request.url, error });
      }
      return response;
    }
  }
  const STREAMER_URL_PREFIX = `streamer`;
  const DOWNLOAD_PREFIX = `book-download`;
  var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
  var dist = {};
  /*! For license information please see index.js.LICENSE.txt */
  (function(exports) {
    (() => {
      var t = { 766: (t2, e2) => {
        e2.byteLength = function(t3) {
          var e3 = u(t3), n3 = e3[0], r3 = e3[1];
          return 3 * (n3 + r3) / 4 - r3;
        }, e2.toByteArray = function(t3) {
          var e3, n3, o3 = u(t3), a2 = o3[0], s2 = o3[1], c2 = new i2(function(t4, e4, n4) {
            return 3 * (e4 + n4) / 4 - n4;
          }(0, a2, s2)), l = 0, f = s2 > 0 ? a2 - 4 : a2;
          for (n3 = 0; n3 < f; n3 += 4)
            e3 = r2[t3.charCodeAt(n3)] << 18 | r2[t3.charCodeAt(n3 + 1)] << 12 | r2[t3.charCodeAt(n3 + 2)] << 6 | r2[t3.charCodeAt(n3 + 3)], c2[l++] = e3 >> 16 & 255, c2[l++] = e3 >> 8 & 255, c2[l++] = 255 & e3;
          return 2 === s2 && (e3 = r2[t3.charCodeAt(n3)] << 2 | r2[t3.charCodeAt(n3 + 1)] >> 4, c2[l++] = 255 & e3), 1 === s2 && (e3 = r2[t3.charCodeAt(n3)] << 10 | r2[t3.charCodeAt(n3 + 1)] << 4 | r2[t3.charCodeAt(n3 + 2)] >> 2, c2[l++] = e3 >> 8 & 255, c2[l++] = 255 & e3), c2;
        }, e2.fromByteArray = function(t3) {
          for (var e3, r3 = t3.length, i3 = r3 % 3, o3 = [], a2 = 16383, s2 = 0, u2 = r3 - i3; s2 < u2; s2 += a2)
            o3.push(c(t3, s2, s2 + a2 > u2 ? u2 : s2 + a2));
          return 1 === i3 ? (e3 = t3[r3 - 1], o3.push(n2[e3 >> 2] + n2[e3 << 4 & 63] + "==")) : 2 === i3 && (e3 = (t3[r3 - 2] << 8) + t3[r3 - 1], o3.push(n2[e3 >> 10] + n2[e3 >> 4 & 63] + n2[e3 << 2 & 63] + "=")), o3.join("");
        };
        for (var n2 = [], r2 = [], i2 = "undefined" != typeof Uint8Array ? Uint8Array : Array, o2 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", a = 0, s = o2.length; a < s; ++a)
          n2[a] = o2[a], r2[o2.charCodeAt(a)] = a;
        function u(t3) {
          var e3 = t3.length;
          if (e3 % 4 > 0)
            throw new Error("Invalid string. Length must be a multiple of 4");
          var n3 = t3.indexOf("=");
          return -1 === n3 && (n3 = e3), [n3, n3 === e3 ? 0 : 4 - n3 % 4];
        }
        function c(t3, e3, r3) {
          for (var i3, o3, a2 = [], s2 = e3; s2 < r3; s2 += 3)
            i3 = (t3[s2] << 16 & 16711680) + (t3[s2 + 1] << 8 & 65280) + (255 & t3[s2 + 2]), a2.push(n2[(o3 = i3) >> 18 & 63] + n2[o3 >> 12 & 63] + n2[o3 >> 6 & 63] + n2[63 & o3]);
          return a2.join("");
        }
        r2["-".charCodeAt(0)] = 62, r2["_".charCodeAt(0)] = 63;
      }, 250: (t2, e2, n2) => {
        const r2 = n2(766), i2 = n2(333), o2 = "function" == typeof Symbol && "function" == typeof Symbol.for ? Symbol.for("nodejs.util.inspect.custom") : null;
        e2.Buffer = u, e2.SlowBuffer = function(t3) {
          return +t3 != t3 && (t3 = 0), u.alloc(+t3);
        }, e2.INSPECT_MAX_BYTES = 50;
        const a = 2147483647;
        function s(t3) {
          if (t3 > a)
            throw new RangeError('The value "' + t3 + '" is invalid for option "size"');
          const e3 = new Uint8Array(t3);
          return Object.setPrototypeOf(e3, u.prototype), e3;
        }
        function u(t3, e3, n3) {
          if ("number" == typeof t3) {
            if ("string" == typeof e3)
              throw new TypeError('The "string" argument must be of type string. Received type number');
            return f(t3);
          }
          return c(t3, e3, n3);
        }
        function c(t3, e3, n3) {
          if ("string" == typeof t3)
            return function(t4, e4) {
              if ("string" == typeof e4 && "" !== e4 || (e4 = "utf8"), !u.isEncoding(e4))
                throw new TypeError("Unknown encoding: " + e4);
              const n4 = 0 | g(t4, e4);
              let r4 = s(n4);
              const i4 = r4.write(t4, e4);
              return i4 !== n4 && (r4 = r4.slice(0, i4)), r4;
            }(t3, e3);
          if (ArrayBuffer.isView(t3))
            return function(t4) {
              if (H(t4, Uint8Array)) {
                const e4 = new Uint8Array(t4);
                return d(e4.buffer, e4.byteOffset, e4.byteLength);
              }
              return h(t4);
            }(t3);
          if (null == t3)
            throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof t3);
          if (H(t3, ArrayBuffer) || t3 && H(t3.buffer, ArrayBuffer))
            return d(t3, e3, n3);
          if ("undefined" != typeof SharedArrayBuffer && (H(t3, SharedArrayBuffer) || t3 && H(t3.buffer, SharedArrayBuffer)))
            return d(t3, e3, n3);
          if ("number" == typeof t3)
            throw new TypeError('The "value" argument must not be of type number. Received type number');
          const r3 = t3.valueOf && t3.valueOf();
          if (null != r3 && r3 !== t3)
            return u.from(r3, e3, n3);
          const i3 = function(t4) {
            if (u.isBuffer(t4)) {
              const e4 = 0 | p(t4.length), n4 = s(e4);
              return 0 === n4.length || t4.copy(n4, 0, 0, e4), n4;
            }
            return void 0 !== t4.length ? "number" != typeof t4.length || Q(t4.length) ? s(0) : h(t4) : "Buffer" === t4.type && Array.isArray(t4.data) ? h(t4.data) : void 0;
          }(t3);
          if (i3)
            return i3;
          if ("undefined" != typeof Symbol && null != Symbol.toPrimitive && "function" == typeof t3[Symbol.toPrimitive])
            return u.from(t3[Symbol.toPrimitive]("string"), e3, n3);
          throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof t3);
        }
        function l(t3) {
          if ("number" != typeof t3)
            throw new TypeError('"size" argument must be of type number');
          if (t3 < 0)
            throw new RangeError('The value "' + t3 + '" is invalid for option "size"');
        }
        function f(t3) {
          return l(t3), s(t3 < 0 ? 0 : 0 | p(t3));
        }
        function h(t3) {
          const e3 = t3.length < 0 ? 0 : 0 | p(t3.length), n3 = s(e3);
          for (let r3 = 0; r3 < e3; r3 += 1)
            n3[r3] = 255 & t3[r3];
          return n3;
        }
        function d(t3, e3, n3) {
          if (e3 < 0 || t3.byteLength < e3)
            throw new RangeError('"offset" is outside of buffer bounds');
          if (t3.byteLength < e3 + (n3 || 0))
            throw new RangeError('"length" is outside of buffer bounds');
          let r3;
          return r3 = void 0 === e3 && void 0 === n3 ? new Uint8Array(t3) : void 0 === n3 ? new Uint8Array(t3, e3) : new Uint8Array(t3, e3, n3), Object.setPrototypeOf(r3, u.prototype), r3;
        }
        function p(t3) {
          if (t3 >= a)
            throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + a.toString(16) + " bytes");
          return 0 | t3;
        }
        function g(t3, e3) {
          if (u.isBuffer(t3))
            return t3.length;
          if (ArrayBuffer.isView(t3) || H(t3, ArrayBuffer))
            return t3.byteLength;
          if ("string" != typeof t3)
            throw new TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof t3);
          const n3 = t3.length, r3 = arguments.length > 2 && true === arguments[2];
          if (!r3 && 0 === n3)
            return 0;
          let i3 = false;
          for (; ; )
            switch (e3) {
              case "ascii":
              case "latin1":
              case "binary":
                return n3;
              case "utf8":
              case "utf-8":
                return Y(t3).length;
              case "ucs2":
              case "ucs-2":
              case "utf16le":
              case "utf-16le":
                return 2 * n3;
              case "hex":
                return n3 >>> 1;
              case "base64":
                return q(t3).length;
              default:
                if (i3)
                  return r3 ? -1 : Y(t3).length;
                e3 = ("" + e3).toLowerCase(), i3 = true;
            }
        }
        function m(t3, e3, n3) {
          let r3 = false;
          if ((void 0 === e3 || e3 < 0) && (e3 = 0), e3 > this.length)
            return "";
          if ((void 0 === n3 || n3 > this.length) && (n3 = this.length), n3 <= 0)
            return "";
          if ((n3 >>>= 0) <= (e3 >>>= 0))
            return "";
          for (t3 || (t3 = "utf8"); ; )
            switch (t3) {
              case "hex":
                return x(this, e3, n3);
              case "utf8":
              case "utf-8":
                return _2(this, e3, n3);
              case "ascii":
                return C(this, e3, n3);
              case "latin1":
              case "binary":
                return O(this, e3, n3);
              case "base64":
                return I(this, e3, n3);
              case "ucs2":
              case "ucs-2":
              case "utf16le":
              case "utf-16le":
                return S(this, e3, n3);
              default:
                if (r3)
                  throw new TypeError("Unknown encoding: " + t3);
                t3 = (t3 + "").toLowerCase(), r3 = true;
            }
        }
        function y(t3, e3, n3) {
          const r3 = t3[e3];
          t3[e3] = t3[n3], t3[n3] = r3;
        }
        function v(t3, e3, n3, r3, i3) {
          if (0 === t3.length)
            return -1;
          if ("string" == typeof n3 ? (r3 = n3, n3 = 0) : n3 > 2147483647 ? n3 = 2147483647 : n3 < -2147483648 && (n3 = -2147483648), Q(n3 = +n3) && (n3 = i3 ? 0 : t3.length - 1), n3 < 0 && (n3 = t3.length + n3), n3 >= t3.length) {
            if (i3)
              return -1;
            n3 = t3.length - 1;
          } else if (n3 < 0) {
            if (!i3)
              return -1;
            n3 = 0;
          }
          if ("string" == typeof e3 && (e3 = u.from(e3, r3)), u.isBuffer(e3))
            return 0 === e3.length ? -1 : b(t3, e3, n3, r3, i3);
          if ("number" == typeof e3)
            return e3 &= 255, "function" == typeof Uint8Array.prototype.indexOf ? i3 ? Uint8Array.prototype.indexOf.call(t3, e3, n3) : Uint8Array.prototype.lastIndexOf.call(t3, e3, n3) : b(t3, [e3], n3, r3, i3);
          throw new TypeError("val must be string, number or Buffer");
        }
        function b(t3, e3, n3, r3, i3) {
          let o3, a2 = 1, s2 = t3.length, u2 = e3.length;
          if (void 0 !== r3 && ("ucs2" === (r3 = String(r3).toLowerCase()) || "ucs-2" === r3 || "utf16le" === r3 || "utf-16le" === r3)) {
            if (t3.length < 2 || e3.length < 2)
              return -1;
            a2 = 2, s2 /= 2, u2 /= 2, n3 /= 2;
          }
          function c2(t4, e4) {
            return 1 === a2 ? t4[e4] : t4.readUInt16BE(e4 * a2);
          }
          if (i3) {
            let r4 = -1;
            for (o3 = n3; o3 < s2; o3++)
              if (c2(t3, o3) === c2(e3, -1 === r4 ? 0 : o3 - r4)) {
                if (-1 === r4 && (r4 = o3), o3 - r4 + 1 === u2)
                  return r4 * a2;
              } else
                -1 !== r4 && (o3 -= o3 - r4), r4 = -1;
          } else
            for (n3 + u2 > s2 && (n3 = s2 - u2), o3 = n3; o3 >= 0; o3--) {
              let n4 = true;
              for (let r4 = 0; r4 < u2; r4++)
                if (c2(t3, o3 + r4) !== c2(e3, r4)) {
                  n4 = false;
                  break;
                }
              if (n4)
                return o3;
            }
          return -1;
        }
        function T(t3, e3, n3, r3) {
          n3 = Number(n3) || 0;
          const i3 = t3.length - n3;
          r3 ? (r3 = Number(r3)) > i3 && (r3 = i3) : r3 = i3;
          const o3 = e3.length;
          let a2;
          for (r3 > o3 / 2 && (r3 = o3 / 2), a2 = 0; a2 < r3; ++a2) {
            const r4 = parseInt(e3.substr(2 * a2, 2), 16);
            if (Q(r4))
              return a2;
            t3[n3 + a2] = r4;
          }
          return a2;
        }
        function E(t3, e3, n3, r3) {
          return z(Y(e3, t3.length - n3), t3, n3, r3);
        }
        function w(t3, e3, n3, r3) {
          return z(function(t4) {
            const e4 = [];
            for (let n4 = 0; n4 < t4.length; ++n4)
              e4.push(255 & t4.charCodeAt(n4));
            return e4;
          }(e3), t3, n3, r3);
        }
        function N(t3, e3, n3, r3) {
          return z(q(e3), t3, n3, r3);
        }
        function A(t3, e3, n3, r3) {
          return z(function(t4, e4) {
            let n4, r4, i3;
            const o3 = [];
            for (let a2 = 0; a2 < t4.length && !((e4 -= 2) < 0); ++a2)
              n4 = t4.charCodeAt(a2), r4 = n4 >> 8, i3 = n4 % 256, o3.push(i3), o3.push(r4);
            return o3;
          }(e3, t3.length - n3), t3, n3, r3);
        }
        function I(t3, e3, n3) {
          return 0 === e3 && n3 === t3.length ? r2.fromByteArray(t3) : r2.fromByteArray(t3.slice(e3, n3));
        }
        function _2(t3, e3, n3) {
          n3 = Math.min(t3.length, n3);
          const r3 = [];
          let i3 = e3;
          for (; i3 < n3; ) {
            const e4 = t3[i3];
            let o3 = null, a2 = e4 > 239 ? 4 : e4 > 223 ? 3 : e4 > 191 ? 2 : 1;
            if (i3 + a2 <= n3) {
              let n4, r4, s2, u2;
              switch (a2) {
                case 1:
                  e4 < 128 && (o3 = e4);
                  break;
                case 2:
                  n4 = t3[i3 + 1], 128 == (192 & n4) && (u2 = (31 & e4) << 6 | 63 & n4, u2 > 127 && (o3 = u2));
                  break;
                case 3:
                  n4 = t3[i3 + 1], r4 = t3[i3 + 2], 128 == (192 & n4) && 128 == (192 & r4) && (u2 = (15 & e4) << 12 | (63 & n4) << 6 | 63 & r4, u2 > 2047 && (u2 < 55296 || u2 > 57343) && (o3 = u2));
                  break;
                case 4:
                  n4 = t3[i3 + 1], r4 = t3[i3 + 2], s2 = t3[i3 + 3], 128 == (192 & n4) && 128 == (192 & r4) && 128 == (192 & s2) && (u2 = (15 & e4) << 18 | (63 & n4) << 12 | (63 & r4) << 6 | 63 & s2, u2 > 65535 && u2 < 1114112 && (o3 = u2));
              }
            }
            null === o3 ? (o3 = 65533, a2 = 1) : o3 > 65535 && (o3 -= 65536, r3.push(o3 >>> 10 & 1023 | 55296), o3 = 56320 | 1023 & o3), r3.push(o3), i3 += a2;
          }
          return function(t4) {
            const e4 = t4.length;
            if (e4 <= B)
              return String.fromCharCode.apply(String, t4);
            let n4 = "", r4 = 0;
            for (; r4 < e4; )
              n4 += String.fromCharCode.apply(String, t4.slice(r4, r4 += B));
            return n4;
          }(r3);
        }
        e2.kMaxLength = a, u.TYPED_ARRAY_SUPPORT = function() {
          try {
            const t3 = new Uint8Array(1), e3 = { foo: function() {
              return 42;
            } };
            return Object.setPrototypeOf(e3, Uint8Array.prototype), Object.setPrototypeOf(t3, e3), 42 === t3.foo();
          } catch (t3) {
            return false;
          }
        }(), u.TYPED_ARRAY_SUPPORT || "undefined" == typeof console || "function" != typeof console.error || console.error("This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support."), Object.defineProperty(u.prototype, "parent", { enumerable: true, get: function() {
          if (u.isBuffer(this))
            return this.buffer;
        } }), Object.defineProperty(u.prototype, "offset", { enumerable: true, get: function() {
          if (u.isBuffer(this))
            return this.byteOffset;
        } }), u.poolSize = 8192, u.from = function(t3, e3, n3) {
          return c(t3, e3, n3);
        }, Object.setPrototypeOf(u.prototype, Uint8Array.prototype), Object.setPrototypeOf(u, Uint8Array), u.alloc = function(t3, e3, n3) {
          return function(t4, e4, n4) {
            return l(t4), t4 <= 0 ? s(t4) : void 0 !== e4 ? "string" == typeof n4 ? s(t4).fill(e4, n4) : s(t4).fill(e4) : s(t4);
          }(t3, e3, n3);
        }, u.allocUnsafe = function(t3) {
          return f(t3);
        }, u.allocUnsafeSlow = function(t3) {
          return f(t3);
        }, u.isBuffer = function(t3) {
          return null != t3 && true === t3._isBuffer && t3 !== u.prototype;
        }, u.compare = function(t3, e3) {
          if (H(t3, Uint8Array) && (t3 = u.from(t3, t3.offset, t3.byteLength)), H(e3, Uint8Array) && (e3 = u.from(e3, e3.offset, e3.byteLength)), !u.isBuffer(t3) || !u.isBuffer(e3))
            throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');
          if (t3 === e3)
            return 0;
          let n3 = t3.length, r3 = e3.length;
          for (let i3 = 0, o3 = Math.min(n3, r3); i3 < o3; ++i3)
            if (t3[i3] !== e3[i3]) {
              n3 = t3[i3], r3 = e3[i3];
              break;
            }
          return n3 < r3 ? -1 : r3 < n3 ? 1 : 0;
        }, u.isEncoding = function(t3) {
          switch (String(t3).toLowerCase()) {
            case "hex":
            case "utf8":
            case "utf-8":
            case "ascii":
            case "latin1":
            case "binary":
            case "base64":
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              return true;
            default:
              return false;
          }
        }, u.concat = function(t3, e3) {
          if (!Array.isArray(t3))
            throw new TypeError('"list" argument must be an Array of Buffers');
          if (0 === t3.length)
            return u.alloc(0);
          let n3;
          if (void 0 === e3)
            for (e3 = 0, n3 = 0; n3 < t3.length; ++n3)
              e3 += t3[n3].length;
          const r3 = u.allocUnsafe(e3);
          let i3 = 0;
          for (n3 = 0; n3 < t3.length; ++n3) {
            let e4 = t3[n3];
            if (H(e4, Uint8Array))
              i3 + e4.length > r3.length ? (u.isBuffer(e4) || (e4 = u.from(e4)), e4.copy(r3, i3)) : Uint8Array.prototype.set.call(r3, e4, i3);
            else {
              if (!u.isBuffer(e4))
                throw new TypeError('"list" argument must be an Array of Buffers');
              e4.copy(r3, i3);
            }
            i3 += e4.length;
          }
          return r3;
        }, u.byteLength = g, u.prototype._isBuffer = true, u.prototype.swap16 = function() {
          const t3 = this.length;
          if (t3 % 2 != 0)
            throw new RangeError("Buffer size must be a multiple of 16-bits");
          for (let e3 = 0; e3 < t3; e3 += 2)
            y(this, e3, e3 + 1);
          return this;
        }, u.prototype.swap32 = function() {
          const t3 = this.length;
          if (t3 % 4 != 0)
            throw new RangeError("Buffer size must be a multiple of 32-bits");
          for (let e3 = 0; e3 < t3; e3 += 4)
            y(this, e3, e3 + 3), y(this, e3 + 1, e3 + 2);
          return this;
        }, u.prototype.swap64 = function() {
          const t3 = this.length;
          if (t3 % 8 != 0)
            throw new RangeError("Buffer size must be a multiple of 64-bits");
          for (let e3 = 0; e3 < t3; e3 += 8)
            y(this, e3, e3 + 7), y(this, e3 + 1, e3 + 6), y(this, e3 + 2, e3 + 5), y(this, e3 + 3, e3 + 4);
          return this;
        }, u.prototype.toString = function() {
          const t3 = this.length;
          return 0 === t3 ? "" : 0 === arguments.length ? _2(this, 0, t3) : m.apply(this, arguments);
        }, u.prototype.toLocaleString = u.prototype.toString, u.prototype.equals = function(t3) {
          if (!u.isBuffer(t3))
            throw new TypeError("Argument must be a Buffer");
          return this === t3 || 0 === u.compare(this, t3);
        }, u.prototype.inspect = function() {
          let t3 = "";
          const n3 = e2.INSPECT_MAX_BYTES;
          return t3 = this.toString("hex", 0, n3).replace(/(.{2})/g, "$1 ").trim(), this.length > n3 && (t3 += " ... "), "<Buffer " + t3 + ">";
        }, o2 && (u.prototype[o2] = u.prototype.inspect), u.prototype.compare = function(t3, e3, n3, r3, i3) {
          if (H(t3, Uint8Array) && (t3 = u.from(t3, t3.offset, t3.byteLength)), !u.isBuffer(t3))
            throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof t3);
          if (void 0 === e3 && (e3 = 0), void 0 === n3 && (n3 = t3 ? t3.length : 0), void 0 === r3 && (r3 = 0), void 0 === i3 && (i3 = this.length), e3 < 0 || n3 > t3.length || r3 < 0 || i3 > this.length)
            throw new RangeError("out of range index");
          if (r3 >= i3 && e3 >= n3)
            return 0;
          if (r3 >= i3)
            return -1;
          if (e3 >= n3)
            return 1;
          if (this === t3)
            return 0;
          let o3 = (i3 >>>= 0) - (r3 >>>= 0), a2 = (n3 >>>= 0) - (e3 >>>= 0);
          const s2 = Math.min(o3, a2), c2 = this.slice(r3, i3), l2 = t3.slice(e3, n3);
          for (let t4 = 0; t4 < s2; ++t4)
            if (c2[t4] !== l2[t4]) {
              o3 = c2[t4], a2 = l2[t4];
              break;
            }
          return o3 < a2 ? -1 : a2 < o3 ? 1 : 0;
        }, u.prototype.includes = function(t3, e3, n3) {
          return -1 !== this.indexOf(t3, e3, n3);
        }, u.prototype.indexOf = function(t3, e3, n3) {
          return v(this, t3, e3, n3, true);
        }, u.prototype.lastIndexOf = function(t3, e3, n3) {
          return v(this, t3, e3, n3, false);
        }, u.prototype.write = function(t3, e3, n3, r3) {
          if (void 0 === e3)
            r3 = "utf8", n3 = this.length, e3 = 0;
          else if (void 0 === n3 && "string" == typeof e3)
            r3 = e3, n3 = this.length, e3 = 0;
          else {
            if (!isFinite(e3))
              throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
            e3 >>>= 0, isFinite(n3) ? (n3 >>>= 0, void 0 === r3 && (r3 = "utf8")) : (r3 = n3, n3 = void 0);
          }
          const i3 = this.length - e3;
          if ((void 0 === n3 || n3 > i3) && (n3 = i3), t3.length > 0 && (n3 < 0 || e3 < 0) || e3 > this.length)
            throw new RangeError("Attempt to write outside buffer bounds");
          r3 || (r3 = "utf8");
          let o3 = false;
          for (; ; )
            switch (r3) {
              case "hex":
                return T(this, t3, e3, n3);
              case "utf8":
              case "utf-8":
                return E(this, t3, e3, n3);
              case "ascii":
              case "latin1":
              case "binary":
                return w(this, t3, e3, n3);
              case "base64":
                return N(this, t3, e3, n3);
              case "ucs2":
              case "ucs-2":
              case "utf16le":
              case "utf-16le":
                return A(this, t3, e3, n3);
              default:
                if (o3)
                  throw new TypeError("Unknown encoding: " + r3);
                r3 = ("" + r3).toLowerCase(), o3 = true;
            }
        }, u.prototype.toJSON = function() {
          return { type: "Buffer", data: Array.prototype.slice.call(this._arr || this, 0) };
        };
        const B = 4096;
        function C(t3, e3, n3) {
          let r3 = "";
          n3 = Math.min(t3.length, n3);
          for (let i3 = e3; i3 < n3; ++i3)
            r3 += String.fromCharCode(127 & t3[i3]);
          return r3;
        }
        function O(t3, e3, n3) {
          let r3 = "";
          n3 = Math.min(t3.length, n3);
          for (let i3 = e3; i3 < n3; ++i3)
            r3 += String.fromCharCode(t3[i3]);
          return r3;
        }
        function x(t3, e3, n3) {
          const r3 = t3.length;
          (!e3 || e3 < 0) && (e3 = 0), (!n3 || n3 < 0 || n3 > r3) && (n3 = r3);
          let i3 = "";
          for (let r4 = e3; r4 < n3; ++r4)
            i3 += Z[t3[r4]];
          return i3;
        }
        function S(t3, e3, n3) {
          const r3 = t3.slice(e3, n3);
          let i3 = "";
          for (let t4 = 0; t4 < r3.length - 1; t4 += 2)
            i3 += String.fromCharCode(r3[t4] + 256 * r3[t4 + 1]);
          return i3;
        }
        function U(t3, e3, n3) {
          if (t3 % 1 != 0 || t3 < 0)
            throw new RangeError("offset is not uint");
          if (t3 + e3 > n3)
            throw new RangeError("Trying to access beyond buffer length");
        }
        function D(t3, e3, n3, r3, i3, o3) {
          if (!u.isBuffer(t3))
            throw new TypeError('"buffer" argument must be a Buffer instance');
          if (e3 > i3 || e3 < o3)
            throw new RangeError('"value" argument is out of bounds');
          if (n3 + r3 > t3.length)
            throw new RangeError("Index out of range");
        }
        function P(t3, e3, n3, r3, i3) {
          k(e3, r3, i3, t3, n3, 7);
          let o3 = Number(e3 & BigInt(4294967295));
          t3[n3++] = o3, o3 >>= 8, t3[n3++] = o3, o3 >>= 8, t3[n3++] = o3, o3 >>= 8, t3[n3++] = o3;
          let a2 = Number(e3 >> BigInt(32) & BigInt(4294967295));
          return t3[n3++] = a2, a2 >>= 8, t3[n3++] = a2, a2 >>= 8, t3[n3++] = a2, a2 >>= 8, t3[n3++] = a2, n3;
        }
        function R(t3, e3, n3, r3, i3) {
          k(e3, r3, i3, t3, n3, 7);
          let o3 = Number(e3 & BigInt(4294967295));
          t3[n3 + 7] = o3, o3 >>= 8, t3[n3 + 6] = o3, o3 >>= 8, t3[n3 + 5] = o3, o3 >>= 8, t3[n3 + 4] = o3;
          let a2 = Number(e3 >> BigInt(32) & BigInt(4294967295));
          return t3[n3 + 3] = a2, a2 >>= 8, t3[n3 + 2] = a2, a2 >>= 8, t3[n3 + 1] = a2, a2 >>= 8, t3[n3] = a2, n3 + 8;
        }
        function L(t3, e3, n3, r3, i3, o3) {
          if (n3 + r3 > t3.length)
            throw new RangeError("Index out of range");
          if (n3 < 0)
            throw new RangeError("Index out of range");
        }
        function F(t3, e3, n3, r3, o3) {
          return e3 = +e3, n3 >>>= 0, o3 || L(t3, 0, n3, 4), i2.write(t3, e3, n3, r3, 23, 4), n3 + 4;
        }
        function M(t3, e3, n3, r3, o3) {
          return e3 = +e3, n3 >>>= 0, o3 || L(t3, 0, n3, 8), i2.write(t3, e3, n3, r3, 52, 8), n3 + 8;
        }
        u.prototype.slice = function(t3, e3) {
          const n3 = this.length;
          (t3 = ~~t3) < 0 ? (t3 += n3) < 0 && (t3 = 0) : t3 > n3 && (t3 = n3), (e3 = void 0 === e3 ? n3 : ~~e3) < 0 ? (e3 += n3) < 0 && (e3 = 0) : e3 > n3 && (e3 = n3), e3 < t3 && (e3 = t3);
          const r3 = this.subarray(t3, e3);
          return Object.setPrototypeOf(r3, u.prototype), r3;
        }, u.prototype.readUintLE = u.prototype.readUIntLE = function(t3, e3, n3) {
          t3 >>>= 0, e3 >>>= 0, n3 || U(t3, e3, this.length);
          let r3 = this[t3], i3 = 1, o3 = 0;
          for (; ++o3 < e3 && (i3 *= 256); )
            r3 += this[t3 + o3] * i3;
          return r3;
        }, u.prototype.readUintBE = u.prototype.readUIntBE = function(t3, e3, n3) {
          t3 >>>= 0, e3 >>>= 0, n3 || U(t3, e3, this.length);
          let r3 = this[t3 + --e3], i3 = 1;
          for (; e3 > 0 && (i3 *= 256); )
            r3 += this[t3 + --e3] * i3;
          return r3;
        }, u.prototype.readUint8 = u.prototype.readUInt8 = function(t3, e3) {
          return t3 >>>= 0, e3 || U(t3, 1, this.length), this[t3];
        }, u.prototype.readUint16LE = u.prototype.readUInt16LE = function(t3, e3) {
          return t3 >>>= 0, e3 || U(t3, 2, this.length), this[t3] | this[t3 + 1] << 8;
        }, u.prototype.readUint16BE = u.prototype.readUInt16BE = function(t3, e3) {
          return t3 >>>= 0, e3 || U(t3, 2, this.length), this[t3] << 8 | this[t3 + 1];
        }, u.prototype.readUint32LE = u.prototype.readUInt32LE = function(t3, e3) {
          return t3 >>>= 0, e3 || U(t3, 4, this.length), (this[t3] | this[t3 + 1] << 8 | this[t3 + 2] << 16) + 16777216 * this[t3 + 3];
        }, u.prototype.readUint32BE = u.prototype.readUInt32BE = function(t3, e3) {
          return t3 >>>= 0, e3 || U(t3, 4, this.length), 16777216 * this[t3] + (this[t3 + 1] << 16 | this[t3 + 2] << 8 | this[t3 + 3]);
        }, u.prototype.readBigUInt64LE = J(function(t3) {
          W(t3 >>>= 0, "offset");
          const e3 = this[t3], n3 = this[t3 + 7];
          void 0 !== e3 && void 0 !== n3 || V(t3, this.length - 8);
          const r3 = e3 + 256 * this[++t3] + 65536 * this[++t3] + this[++t3] * 2 ** 24, i3 = this[++t3] + 256 * this[++t3] + 65536 * this[++t3] + n3 * 2 ** 24;
          return BigInt(r3) + (BigInt(i3) << BigInt(32));
        }), u.prototype.readBigUInt64BE = J(function(t3) {
          W(t3 >>>= 0, "offset");
          const e3 = this[t3], n3 = this[t3 + 7];
          void 0 !== e3 && void 0 !== n3 || V(t3, this.length - 8);
          const r3 = e3 * 2 ** 24 + 65536 * this[++t3] + 256 * this[++t3] + this[++t3], i3 = this[++t3] * 2 ** 24 + 65536 * this[++t3] + 256 * this[++t3] + n3;
          return (BigInt(r3) << BigInt(32)) + BigInt(i3);
        }), u.prototype.readIntLE = function(t3, e3, n3) {
          t3 >>>= 0, e3 >>>= 0, n3 || U(t3, e3, this.length);
          let r3 = this[t3], i3 = 1, o3 = 0;
          for (; ++o3 < e3 && (i3 *= 256); )
            r3 += this[t3 + o3] * i3;
          return i3 *= 128, r3 >= i3 && (r3 -= Math.pow(2, 8 * e3)), r3;
        }, u.prototype.readIntBE = function(t3, e3, n3) {
          t3 >>>= 0, e3 >>>= 0, n3 || U(t3, e3, this.length);
          let r3 = e3, i3 = 1, o3 = this[t3 + --r3];
          for (; r3 > 0 && (i3 *= 256); )
            o3 += this[t3 + --r3] * i3;
          return i3 *= 128, o3 >= i3 && (o3 -= Math.pow(2, 8 * e3)), o3;
        }, u.prototype.readInt8 = function(t3, e3) {
          return t3 >>>= 0, e3 || U(t3, 1, this.length), 128 & this[t3] ? -1 * (255 - this[t3] + 1) : this[t3];
        }, u.prototype.readInt16LE = function(t3, e3) {
          t3 >>>= 0, e3 || U(t3, 2, this.length);
          const n3 = this[t3] | this[t3 + 1] << 8;
          return 32768 & n3 ? 4294901760 | n3 : n3;
        }, u.prototype.readInt16BE = function(t3, e3) {
          t3 >>>= 0, e3 || U(t3, 2, this.length);
          const n3 = this[t3 + 1] | this[t3] << 8;
          return 32768 & n3 ? 4294901760 | n3 : n3;
        }, u.prototype.readInt32LE = function(t3, e3) {
          return t3 >>>= 0, e3 || U(t3, 4, this.length), this[t3] | this[t3 + 1] << 8 | this[t3 + 2] << 16 | this[t3 + 3] << 24;
        }, u.prototype.readInt32BE = function(t3, e3) {
          return t3 >>>= 0, e3 || U(t3, 4, this.length), this[t3] << 24 | this[t3 + 1] << 16 | this[t3 + 2] << 8 | this[t3 + 3];
        }, u.prototype.readBigInt64LE = J(function(t3) {
          W(t3 >>>= 0, "offset");
          const e3 = this[t3], n3 = this[t3 + 7];
          void 0 !== e3 && void 0 !== n3 || V(t3, this.length - 8);
          const r3 = this[t3 + 4] + 256 * this[t3 + 5] + 65536 * this[t3 + 6] + (n3 << 24);
          return (BigInt(r3) << BigInt(32)) + BigInt(e3 + 256 * this[++t3] + 65536 * this[++t3] + this[++t3] * 2 ** 24);
        }), u.prototype.readBigInt64BE = J(function(t3) {
          W(t3 >>>= 0, "offset");
          const e3 = this[t3], n3 = this[t3 + 7];
          void 0 !== e3 && void 0 !== n3 || V(t3, this.length - 8);
          const r3 = (e3 << 24) + 65536 * this[++t3] + 256 * this[++t3] + this[++t3];
          return (BigInt(r3) << BigInt(32)) + BigInt(this[++t3] * 2 ** 24 + 65536 * this[++t3] + 256 * this[++t3] + n3);
        }), u.prototype.readFloatLE = function(t3, e3) {
          return t3 >>>= 0, e3 || U(t3, 4, this.length), i2.read(this, t3, true, 23, 4);
        }, u.prototype.readFloatBE = function(t3, e3) {
          return t3 >>>= 0, e3 || U(t3, 4, this.length), i2.read(this, t3, false, 23, 4);
        }, u.prototype.readDoubleLE = function(t3, e3) {
          return t3 >>>= 0, e3 || U(t3, 8, this.length), i2.read(this, t3, true, 52, 8);
        }, u.prototype.readDoubleBE = function(t3, e3) {
          return t3 >>>= 0, e3 || U(t3, 8, this.length), i2.read(this, t3, false, 52, 8);
        }, u.prototype.writeUintLE = u.prototype.writeUIntLE = function(t3, e3, n3, r3) {
          t3 = +t3, e3 >>>= 0, n3 >>>= 0, r3 || D(this, t3, e3, n3, Math.pow(2, 8 * n3) - 1, 0);
          let i3 = 1, o3 = 0;
          for (this[e3] = 255 & t3; ++o3 < n3 && (i3 *= 256); )
            this[e3 + o3] = t3 / i3 & 255;
          return e3 + n3;
        }, u.prototype.writeUintBE = u.prototype.writeUIntBE = function(t3, e3, n3, r3) {
          t3 = +t3, e3 >>>= 0, n3 >>>= 0, r3 || D(this, t3, e3, n3, Math.pow(2, 8 * n3) - 1, 0);
          let i3 = n3 - 1, o3 = 1;
          for (this[e3 + i3] = 255 & t3; --i3 >= 0 && (o3 *= 256); )
            this[e3 + i3] = t3 / o3 & 255;
          return e3 + n3;
        }, u.prototype.writeUint8 = u.prototype.writeUInt8 = function(t3, e3, n3) {
          return t3 = +t3, e3 >>>= 0, n3 || D(this, t3, e3, 1, 255, 0), this[e3] = 255 & t3, e3 + 1;
        }, u.prototype.writeUint16LE = u.prototype.writeUInt16LE = function(t3, e3, n3) {
          return t3 = +t3, e3 >>>= 0, n3 || D(this, t3, e3, 2, 65535, 0), this[e3] = 255 & t3, this[e3 + 1] = t3 >>> 8, e3 + 2;
        }, u.prototype.writeUint16BE = u.prototype.writeUInt16BE = function(t3, e3, n3) {
          return t3 = +t3, e3 >>>= 0, n3 || D(this, t3, e3, 2, 65535, 0), this[e3] = t3 >>> 8, this[e3 + 1] = 255 & t3, e3 + 2;
        }, u.prototype.writeUint32LE = u.prototype.writeUInt32LE = function(t3, e3, n3) {
          return t3 = +t3, e3 >>>= 0, n3 || D(this, t3, e3, 4, 4294967295, 0), this[e3 + 3] = t3 >>> 24, this[e3 + 2] = t3 >>> 16, this[e3 + 1] = t3 >>> 8, this[e3] = 255 & t3, e3 + 4;
        }, u.prototype.writeUint32BE = u.prototype.writeUInt32BE = function(t3, e3, n3) {
          return t3 = +t3, e3 >>>= 0, n3 || D(this, t3, e3, 4, 4294967295, 0), this[e3] = t3 >>> 24, this[e3 + 1] = t3 >>> 16, this[e3 + 2] = t3 >>> 8, this[e3 + 3] = 255 & t3, e3 + 4;
        }, u.prototype.writeBigUInt64LE = J(function(t3, e3 = 0) {
          return P(this, t3, e3, BigInt(0), BigInt("0xffffffffffffffff"));
        }), u.prototype.writeBigUInt64BE = J(function(t3, e3 = 0) {
          return R(this, t3, e3, BigInt(0), BigInt("0xffffffffffffffff"));
        }), u.prototype.writeIntLE = function(t3, e3, n3, r3) {
          if (t3 = +t3, e3 >>>= 0, !r3) {
            const r4 = Math.pow(2, 8 * n3 - 1);
            D(this, t3, e3, n3, r4 - 1, -r4);
          }
          let i3 = 0, o3 = 1, a2 = 0;
          for (this[e3] = 255 & t3; ++i3 < n3 && (o3 *= 256); )
            t3 < 0 && 0 === a2 && 0 !== this[e3 + i3 - 1] && (a2 = 1), this[e3 + i3] = (t3 / o3 >> 0) - a2 & 255;
          return e3 + n3;
        }, u.prototype.writeIntBE = function(t3, e3, n3, r3) {
          if (t3 = +t3, e3 >>>= 0, !r3) {
            const r4 = Math.pow(2, 8 * n3 - 1);
            D(this, t3, e3, n3, r4 - 1, -r4);
          }
          let i3 = n3 - 1, o3 = 1, a2 = 0;
          for (this[e3 + i3] = 255 & t3; --i3 >= 0 && (o3 *= 256); )
            t3 < 0 && 0 === a2 && 0 !== this[e3 + i3 + 1] && (a2 = 1), this[e3 + i3] = (t3 / o3 >> 0) - a2 & 255;
          return e3 + n3;
        }, u.prototype.writeInt8 = function(t3, e3, n3) {
          return t3 = +t3, e3 >>>= 0, n3 || D(this, t3, e3, 1, 127, -128), t3 < 0 && (t3 = 255 + t3 + 1), this[e3] = 255 & t3, e3 + 1;
        }, u.prototype.writeInt16LE = function(t3, e3, n3) {
          return t3 = +t3, e3 >>>= 0, n3 || D(this, t3, e3, 2, 32767, -32768), this[e3] = 255 & t3, this[e3 + 1] = t3 >>> 8, e3 + 2;
        }, u.prototype.writeInt16BE = function(t3, e3, n3) {
          return t3 = +t3, e3 >>>= 0, n3 || D(this, t3, e3, 2, 32767, -32768), this[e3] = t3 >>> 8, this[e3 + 1] = 255 & t3, e3 + 2;
        }, u.prototype.writeInt32LE = function(t3, e3, n3) {
          return t3 = +t3, e3 >>>= 0, n3 || D(this, t3, e3, 4, 2147483647, -2147483648), this[e3] = 255 & t3, this[e3 + 1] = t3 >>> 8, this[e3 + 2] = t3 >>> 16, this[e3 + 3] = t3 >>> 24, e3 + 4;
        }, u.prototype.writeInt32BE = function(t3, e3, n3) {
          return t3 = +t3, e3 >>>= 0, n3 || D(this, t3, e3, 4, 2147483647, -2147483648), t3 < 0 && (t3 = 4294967295 + t3 + 1), this[e3] = t3 >>> 24, this[e3 + 1] = t3 >>> 16, this[e3 + 2] = t3 >>> 8, this[e3 + 3] = 255 & t3, e3 + 4;
        }, u.prototype.writeBigInt64LE = J(function(t3, e3 = 0) {
          return P(this, t3, e3, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
        }), u.prototype.writeBigInt64BE = J(function(t3, e3 = 0) {
          return R(this, t3, e3, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
        }), u.prototype.writeFloatLE = function(t3, e3, n3) {
          return F(this, t3, e3, true, n3);
        }, u.prototype.writeFloatBE = function(t3, e3, n3) {
          return F(this, t3, e3, false, n3);
        }, u.prototype.writeDoubleLE = function(t3, e3, n3) {
          return M(this, t3, e3, true, n3);
        }, u.prototype.writeDoubleBE = function(t3, e3, n3) {
          return M(this, t3, e3, false, n3);
        }, u.prototype.copy = function(t3, e3, n3, r3) {
          if (!u.isBuffer(t3))
            throw new TypeError("argument should be a Buffer");
          if (n3 || (n3 = 0), r3 || 0 === r3 || (r3 = this.length), e3 >= t3.length && (e3 = t3.length), e3 || (e3 = 0), r3 > 0 && r3 < n3 && (r3 = n3), r3 === n3)
            return 0;
          if (0 === t3.length || 0 === this.length)
            return 0;
          if (e3 < 0)
            throw new RangeError("targetStart out of bounds");
          if (n3 < 0 || n3 >= this.length)
            throw new RangeError("Index out of range");
          if (r3 < 0)
            throw new RangeError("sourceEnd out of bounds");
          r3 > this.length && (r3 = this.length), t3.length - e3 < r3 - n3 && (r3 = t3.length - e3 + n3);
          const i3 = r3 - n3;
          return this === t3 && "function" == typeof Uint8Array.prototype.copyWithin ? this.copyWithin(e3, n3, r3) : Uint8Array.prototype.set.call(t3, this.subarray(n3, r3), e3), i3;
        }, u.prototype.fill = function(t3, e3, n3, r3) {
          if ("string" == typeof t3) {
            if ("string" == typeof e3 ? (r3 = e3, e3 = 0, n3 = this.length) : "string" == typeof n3 && (r3 = n3, n3 = this.length), void 0 !== r3 && "string" != typeof r3)
              throw new TypeError("encoding must be a string");
            if ("string" == typeof r3 && !u.isEncoding(r3))
              throw new TypeError("Unknown encoding: " + r3);
            if (1 === t3.length) {
              const e4 = t3.charCodeAt(0);
              ("utf8" === r3 && e4 < 128 || "latin1" === r3) && (t3 = e4);
            }
          } else
            "number" == typeof t3 ? t3 &= 255 : "boolean" == typeof t3 && (t3 = Number(t3));
          if (e3 < 0 || this.length < e3 || this.length < n3)
            throw new RangeError("Out of range index");
          if (n3 <= e3)
            return this;
          let i3;
          if (e3 >>>= 0, n3 = void 0 === n3 ? this.length : n3 >>> 0, t3 || (t3 = 0), "number" == typeof t3)
            for (i3 = e3; i3 < n3; ++i3)
              this[i3] = t3;
          else {
            const o3 = u.isBuffer(t3) ? t3 : u.from(t3, r3), a2 = o3.length;
            if (0 === a2)
              throw new TypeError('The value "' + t3 + '" is invalid for argument "value"');
            for (i3 = 0; i3 < n3 - e3; ++i3)
              this[i3 + e3] = o3[i3 % a2];
          }
          return this;
        };
        const $ = {};
        function j(t3, e3, n3) {
          $[t3] = class extends n3 {
            constructor() {
              super(), Object.defineProperty(this, "message", { value: e3.apply(this, arguments), writable: true, configurable: true }), this.name = `${this.name} [${t3}]`, this.stack, delete this.name;
            }
            get code() {
              return t3;
            }
            set code(t4) {
              Object.defineProperty(this, "code", { configurable: true, enumerable: true, value: t4, writable: true });
            }
            toString() {
              return `${this.name} [${t3}]: ${this.message}`;
            }
          };
        }
        function G(t3) {
          let e3 = "", n3 = t3.length;
          const r3 = "-" === t3[0] ? 1 : 0;
          for (; n3 >= r3 + 4; n3 -= 3)
            e3 = `_${t3.slice(n3 - 3, n3)}${e3}`;
          return `${t3.slice(0, n3)}${e3}`;
        }
        function k(t3, e3, n3, r3, i3, o3) {
          if (t3 > n3 || t3 < e3) {
            const r4 = "bigint" == typeof e3 ? "n" : "";
            let i4;
            throw i4 = o3 > 3 ? 0 === e3 || e3 === BigInt(0) ? `>= 0${r4} and < 2${r4} ** ${8 * (o3 + 1)}${r4}` : `>= -(2${r4} ** ${8 * (o3 + 1) - 1}${r4}) and < 2 ** ${8 * (o3 + 1) - 1}${r4}` : `>= ${e3}${r4} and <= ${n3}${r4}`, new $.ERR_OUT_OF_RANGE("value", i4, t3);
          }
          !function(t4, e4, n4) {
            W(e4, "offset"), void 0 !== t4[e4] && void 0 !== t4[e4 + n4] || V(e4, t4.length - (n4 + 1));
          }(r3, i3, o3);
        }
        function W(t3, e3) {
          if ("number" != typeof t3)
            throw new $.ERR_INVALID_ARG_TYPE(e3, "number", t3);
        }
        function V(t3, e3, n3) {
          if (Math.floor(t3) !== t3)
            throw W(t3, n3), new $.ERR_OUT_OF_RANGE(n3 || "offset", "an integer", t3);
          if (e3 < 0)
            throw new $.ERR_BUFFER_OUT_OF_BOUNDS();
          throw new $.ERR_OUT_OF_RANGE(n3 || "offset", `>= ${n3 ? 1 : 0} and <= ${e3}`, t3);
        }
        j("ERR_BUFFER_OUT_OF_BOUNDS", function(t3) {
          return t3 ? `${t3} is outside of buffer bounds` : "Attempt to access memory outside buffer bounds";
        }, RangeError), j("ERR_INVALID_ARG_TYPE", function(t3, e3) {
          return `The "${t3}" argument must be of type number. Received type ${typeof e3}`;
        }, TypeError), j("ERR_OUT_OF_RANGE", function(t3, e3, n3) {
          let r3 = `The value of "${t3}" is out of range.`, i3 = n3;
          return Number.isInteger(n3) && Math.abs(n3) > 2 ** 32 ? i3 = G(String(n3)) : "bigint" == typeof n3 && (i3 = String(n3), (n3 > BigInt(2) ** BigInt(32) || n3 < -(BigInt(2) ** BigInt(32))) && (i3 = G(i3)), i3 += "n"), r3 += ` It must be ${e3}. Received ${i3}`, r3;
        }, RangeError);
        const X = /[^+/0-9A-Za-z-_]/g;
        function Y(t3, e3) {
          let n3;
          e3 = e3 || 1 / 0;
          const r3 = t3.length;
          let i3 = null;
          const o3 = [];
          for (let a2 = 0; a2 < r3; ++a2) {
            if (n3 = t3.charCodeAt(a2), n3 > 55295 && n3 < 57344) {
              if (!i3) {
                if (n3 > 56319) {
                  (e3 -= 3) > -1 && o3.push(239, 191, 189);
                  continue;
                }
                if (a2 + 1 === r3) {
                  (e3 -= 3) > -1 && o3.push(239, 191, 189);
                  continue;
                }
                i3 = n3;
                continue;
              }
              if (n3 < 56320) {
                (e3 -= 3) > -1 && o3.push(239, 191, 189), i3 = n3;
                continue;
              }
              n3 = 65536 + (i3 - 55296 << 10 | n3 - 56320);
            } else
              i3 && (e3 -= 3) > -1 && o3.push(239, 191, 189);
            if (i3 = null, n3 < 128) {
              if ((e3 -= 1) < 0)
                break;
              o3.push(n3);
            } else if (n3 < 2048) {
              if ((e3 -= 2) < 0)
                break;
              o3.push(n3 >> 6 | 192, 63 & n3 | 128);
            } else if (n3 < 65536) {
              if ((e3 -= 3) < 0)
                break;
              o3.push(n3 >> 12 | 224, n3 >> 6 & 63 | 128, 63 & n3 | 128);
            } else {
              if (!(n3 < 1114112))
                throw new Error("Invalid code point");
              if ((e3 -= 4) < 0)
                break;
              o3.push(n3 >> 18 | 240, n3 >> 12 & 63 | 128, n3 >> 6 & 63 | 128, 63 & n3 | 128);
            }
          }
          return o3;
        }
        function q(t3) {
          return r2.toByteArray(function(t4) {
            if ((t4 = (t4 = t4.split("=")[0]).trim().replace(X, "")).length < 2)
              return "";
            for (; t4.length % 4 != 0; )
              t4 += "=";
            return t4;
          }(t3));
        }
        function z(t3, e3, n3, r3) {
          let i3;
          for (i3 = 0; i3 < r3 && !(i3 + n3 >= e3.length || i3 >= t3.length); ++i3)
            e3[i3 + n3] = t3[i3];
          return i3;
        }
        function H(t3, e3) {
          return t3 instanceof e3 || null != t3 && null != t3.constructor && null != t3.constructor.name && t3.constructor.name === e3.name;
        }
        function Q(t3) {
          return t3 != t3;
        }
        const Z = function() {
          const t3 = "0123456789abcdef", e3 = new Array(256);
          for (let n3 = 0; n3 < 16; ++n3) {
            const r3 = 16 * n3;
            for (let i3 = 0; i3 < 16; ++i3)
              e3[r3 + i3] = t3[n3] + t3[i3];
          }
          return e3;
        }();
        function J(t3) {
          return "undefined" == typeof BigInt ? K : t3;
        }
        function K() {
          throw new Error("BigInt not supported");
        }
      }, 333: (t2, e2) => {
        e2.read = function(t3, e3, n2, r2, i2) {
          var o2, a, s = 8 * i2 - r2 - 1, u = (1 << s) - 1, c = u >> 1, l = -7, f = n2 ? i2 - 1 : 0, h = n2 ? -1 : 1, d = t3[e3 + f];
          for (f += h, o2 = d & (1 << -l) - 1, d >>= -l, l += s; l > 0; o2 = 256 * o2 + t3[e3 + f], f += h, l -= 8)
            ;
          for (a = o2 & (1 << -l) - 1, o2 >>= -l, l += r2; l > 0; a = 256 * a + t3[e3 + f], f += h, l -= 8)
            ;
          if (0 === o2)
            o2 = 1 - c;
          else {
            if (o2 === u)
              return a ? NaN : 1 / 0 * (d ? -1 : 1);
            a += Math.pow(2, r2), o2 -= c;
          }
          return (d ? -1 : 1) * a * Math.pow(2, o2 - r2);
        }, e2.write = function(t3, e3, n2, r2, i2, o2) {
          var a, s, u, c = 8 * o2 - i2 - 1, l = (1 << c) - 1, f = l >> 1, h = 23 === i2 ? Math.pow(2, -24) - Math.pow(2, -77) : 0, d = r2 ? 0 : o2 - 1, p = r2 ? 1 : -1, g = e3 < 0 || 0 === e3 && 1 / e3 < 0 ? 1 : 0;
          for (e3 = Math.abs(e3), isNaN(e3) || e3 === 1 / 0 ? (s = isNaN(e3) ? 1 : 0, a = l) : (a = Math.floor(Math.log(e3) / Math.LN2), e3 * (u = Math.pow(2, -a)) < 1 && (a--, u *= 2), (e3 += a + f >= 1 ? h / u : h * Math.pow(2, 1 - f)) * u >= 2 && (a++, u /= 2), a + f >= l ? (s = 0, a = l) : a + f >= 1 ? (s = (e3 * u - 1) * Math.pow(2, i2), a += f) : (s = e3 * Math.pow(2, f - 1) * Math.pow(2, i2), a = 0)); i2 >= 8; t3[n2 + d] = 255 & s, d += p, s /= 256, i2 -= 8)
            ;
          for (a = a << i2 | s, c += i2; c > 0; t3[n2 + d] = 255 & a, d += p, a /= 256, c -= 8)
            ;
          t3[n2 + d - p] |= 128 * g;
        };
      }, 834: (t2, e2, n2) => {
        var r2 = n2(250), i2 = r2.Buffer;
        function o2(t3, e3) {
          for (var n3 in t3)
            e3[n3] = t3[n3];
        }
        function a(t3, e3, n3) {
          return i2(t3, e3, n3);
        }
        i2.from && i2.alloc && i2.allocUnsafe && i2.allocUnsafeSlow ? t2.exports = r2 : (o2(r2, e2), e2.Buffer = a), a.prototype = Object.create(i2.prototype), o2(i2, a), a.from = function(t3, e3, n3) {
          if ("number" == typeof t3)
            throw new TypeError("Argument must not be a number");
          return i2(t3, e3, n3);
        }, a.alloc = function(t3, e3, n3) {
          if ("number" != typeof t3)
            throw new TypeError("Argument must be a number");
          var r3 = i2(t3);
          return void 0 !== e3 ? "string" == typeof n3 ? r3.fill(e3, n3) : r3.fill(e3) : r3.fill(0), r3;
        }, a.allocUnsafe = function(t3) {
          if ("number" != typeof t3)
            throw new TypeError("Argument must be a number");
          return i2(t3);
        }, a.allocUnsafeSlow = function(t3) {
          if ("number" != typeof t3)
            throw new TypeError("Argument must be a number");
          return r2.SlowBuffer(t3);
        };
      }, 480: (t2, e2, n2) => {
        !function(t3) {
          t3.parser = function(t4, e4) {
            return new i2(t4, e4);
          }, t3.SAXParser = i2, t3.SAXStream = a, t3.createStream = function(t4, e4) {
            return new a(t4, e4);
          }, t3.MAX_BUFFER_LENGTH = 65536;
          var e3, r2 = ["comment", "sgmlDecl", "textNode", "tagName", "doctype", "procInstName", "procInstBody", "entity", "attribName", "attribValue", "cdata", "script"];
          function i2(e4, n3) {
            if (!(this instanceof i2))
              return new i2(e4, n3);
            var o3 = this;
            !function(t4) {
              for (var e5 = 0, n4 = r2.length; e5 < n4; e5++)
                t4[r2[e5]] = "";
            }(o3), o3.q = o3.c = "", o3.bufferCheckPosition = t3.MAX_BUFFER_LENGTH, o3.opt = n3 || {}, o3.opt.lowercase = o3.opt.lowercase || o3.opt.lowercasetags, o3.looseCase = o3.opt.lowercase ? "toLowerCase" : "toUpperCase", o3.tags = [], o3.closed = o3.closedRoot = o3.sawRoot = false, o3.tag = o3.error = null, o3.strict = !!e4, o3.noscript = !(!e4 && !o3.opt.noscript), o3.state = w.BEGIN, o3.strictEntities = o3.opt.strictEntities, o3.ENTITIES = o3.strictEntities ? Object.create(t3.XML_ENTITIES) : Object.create(t3.ENTITIES), o3.attribList = [], o3.opt.xmlns && (o3.ns = Object.create(c)), o3.trackPosition = false !== o3.opt.position, o3.trackPosition && (o3.position = o3.line = o3.column = 0), A(o3, "onready");
          }
          t3.EVENTS = ["text", "processinginstruction", "sgmldeclaration", "doctype", "comment", "opentagstart", "attribute", "opentag", "closetag", "opencdata", "cdata", "closecdata", "error", "end", "ready", "script", "opennamespace", "closenamespace"], Object.create || (Object.create = function(t4) {
            function e4() {
            }
            return e4.prototype = t4, new e4();
          }), Object.keys || (Object.keys = function(t4) {
            var e4 = [];
            for (var n3 in t4)
              t4.hasOwnProperty(n3) && e4.push(n3);
            return e4;
          }), i2.prototype = { end: function() {
            O(this);
          }, write: function(e4) {
            var n3 = this;
            if (this.error)
              throw this.error;
            if (n3.closed)
              return C(n3, "Cannot write after close. Assign an onready handler.");
            if (null === e4)
              return O(n3);
            "object" == typeof e4 && (e4 = e4.toString());
            for (var i3 = 0, o3 = ""; o3 = M(e4, i3++), n3.c = o3, o3; )
              switch (n3.trackPosition && (n3.position++, "\n" === o3 ? (n3.line++, n3.column = 0) : n3.column++), n3.state) {
                case w.BEGIN:
                  if (n3.state = w.BEGIN_WHITESPACE, "\uFEFF" === o3)
                    continue;
                  F(n3, o3);
                  continue;
                case w.BEGIN_WHITESPACE:
                  F(n3, o3);
                  continue;
                case w.TEXT:
                  if (n3.sawRoot && !n3.closedRoot) {
                    for (var a2 = i3 - 1; o3 && "<" !== o3 && "&" !== o3; )
                      (o3 = M(e4, i3++)) && n3.trackPosition && (n3.position++, "\n" === o3 ? (n3.line++, n3.column = 0) : n3.column++);
                    n3.textNode += e4.substring(a2, i3 - 1);
                  }
                  "<" !== o3 || n3.sawRoot && n3.closedRoot && !n3.strict ? (p(o3) || n3.sawRoot && !n3.closedRoot || x(n3, "Text data outside of root node."), "&" === o3 ? n3.state = w.TEXT_ENTITY : n3.textNode += o3) : (n3.state = w.OPEN_WAKA, n3.startTagPosition = n3.position);
                  continue;
                case w.SCRIPT:
                  "<" === o3 ? n3.state = w.SCRIPT_ENDING : n3.script += o3;
                  continue;
                case w.SCRIPT_ENDING:
                  "/" === o3 ? n3.state = w.CLOSE_TAG : (n3.script += "<" + o3, n3.state = w.SCRIPT);
                  continue;
                case w.OPEN_WAKA:
                  if ("!" === o3)
                    n3.state = w.SGML_DECL, n3.sgmlDecl = "";
                  else if (p(o3))
                    ;
                  else if (y(l, o3))
                    n3.state = w.OPEN_TAG, n3.tagName = o3;
                  else if ("/" === o3)
                    n3.state = w.CLOSE_TAG, n3.tagName = "";
                  else if ("?" === o3)
                    n3.state = w.PROC_INST, n3.procInstName = n3.procInstBody = "";
                  else {
                    if (x(n3, "Unencoded <"), n3.startTagPosition + 1 < n3.position) {
                      var s2 = n3.position - n3.startTagPosition;
                      o3 = new Array(s2).join(" ") + o3;
                    }
                    n3.textNode += "<" + o3, n3.state = w.TEXT;
                  }
                  continue;
                case w.SGML_DECL:
                  "[CDATA[" === (n3.sgmlDecl + o3).toUpperCase() ? (I(n3, "onopencdata"), n3.state = w.CDATA, n3.sgmlDecl = "", n3.cdata = "") : n3.sgmlDecl + o3 === "--" ? (n3.state = w.COMMENT, n3.comment = "", n3.sgmlDecl = "") : "DOCTYPE" === (n3.sgmlDecl + o3).toUpperCase() ? (n3.state = w.DOCTYPE, (n3.doctype || n3.sawRoot) && x(n3, "Inappropriately located doctype declaration"), n3.doctype = "", n3.sgmlDecl = "") : ">" === o3 ? (I(n3, "onsgmldeclaration", n3.sgmlDecl), n3.sgmlDecl = "", n3.state = w.TEXT) : g(o3) ? (n3.state = w.SGML_DECL_QUOTED, n3.sgmlDecl += o3) : n3.sgmlDecl += o3;
                  continue;
                case w.SGML_DECL_QUOTED:
                  o3 === n3.q && (n3.state = w.SGML_DECL, n3.q = ""), n3.sgmlDecl += o3;
                  continue;
                case w.DOCTYPE:
                  ">" === o3 ? (n3.state = w.TEXT, I(n3, "ondoctype", n3.doctype), n3.doctype = true) : (n3.doctype += o3, "[" === o3 ? n3.state = w.DOCTYPE_DTD : g(o3) && (n3.state = w.DOCTYPE_QUOTED, n3.q = o3));
                  continue;
                case w.DOCTYPE_QUOTED:
                  n3.doctype += o3, o3 === n3.q && (n3.q = "", n3.state = w.DOCTYPE);
                  continue;
                case w.DOCTYPE_DTD:
                  n3.doctype += o3, "]" === o3 ? n3.state = w.DOCTYPE : g(o3) && (n3.state = w.DOCTYPE_DTD_QUOTED, n3.q = o3);
                  continue;
                case w.DOCTYPE_DTD_QUOTED:
                  n3.doctype += o3, o3 === n3.q && (n3.state = w.DOCTYPE_DTD, n3.q = "");
                  continue;
                case w.COMMENT:
                  "-" === o3 ? n3.state = w.COMMENT_ENDING : n3.comment += o3;
                  continue;
                case w.COMMENT_ENDING:
                  "-" === o3 ? (n3.state = w.COMMENT_ENDED, n3.comment = B(n3.opt, n3.comment), n3.comment && I(n3, "oncomment", n3.comment), n3.comment = "") : (n3.comment += "-" + o3, n3.state = w.COMMENT);
                  continue;
                case w.COMMENT_ENDED:
                  ">" !== o3 ? (x(n3, "Malformed comment"), n3.comment += "--" + o3, n3.state = w.COMMENT) : n3.state = w.TEXT;
                  continue;
                case w.CDATA:
                  "]" === o3 ? n3.state = w.CDATA_ENDING : n3.cdata += o3;
                  continue;
                case w.CDATA_ENDING:
                  "]" === o3 ? n3.state = w.CDATA_ENDING_2 : (n3.cdata += "]" + o3, n3.state = w.CDATA);
                  continue;
                case w.CDATA_ENDING_2:
                  ">" === o3 ? (n3.cdata && I(n3, "oncdata", n3.cdata), I(n3, "onclosecdata"), n3.cdata = "", n3.state = w.TEXT) : "]" === o3 ? n3.cdata += "]" : (n3.cdata += "]]" + o3, n3.state = w.CDATA);
                  continue;
                case w.PROC_INST:
                  "?" === o3 ? n3.state = w.PROC_INST_ENDING : p(o3) ? n3.state = w.PROC_INST_BODY : n3.procInstName += o3;
                  continue;
                case w.PROC_INST_BODY:
                  if (!n3.procInstBody && p(o3))
                    continue;
                  "?" === o3 ? n3.state = w.PROC_INST_ENDING : n3.procInstBody += o3;
                  continue;
                case w.PROC_INST_ENDING:
                  ">" === o3 ? (I(n3, "onprocessinginstruction", { name: n3.procInstName, body: n3.procInstBody }), n3.procInstName = n3.procInstBody = "", n3.state = w.TEXT) : (n3.procInstBody += "?" + o3, n3.state = w.PROC_INST_BODY);
                  continue;
                case w.OPEN_TAG:
                  y(f, o3) ? n3.tagName += o3 : (S(n3), ">" === o3 ? P(n3) : "/" === o3 ? n3.state = w.OPEN_TAG_SLASH : (p(o3) || x(n3, "Invalid character in tag name"), n3.state = w.ATTRIB));
                  continue;
                case w.OPEN_TAG_SLASH:
                  ">" === o3 ? (P(n3, true), R(n3)) : (x(n3, "Forward-slash in opening tag not followed by >"), n3.state = w.ATTRIB);
                  continue;
                case w.ATTRIB:
                  if (p(o3))
                    continue;
                  ">" === o3 ? P(n3) : "/" === o3 ? n3.state = w.OPEN_TAG_SLASH : y(l, o3) ? (n3.attribName = o3, n3.attribValue = "", n3.state = w.ATTRIB_NAME) : x(n3, "Invalid attribute name");
                  continue;
                case w.ATTRIB_NAME:
                  "=" === o3 ? n3.state = w.ATTRIB_VALUE : ">" === o3 ? (x(n3, "Attribute without value"), n3.attribValue = n3.attribName, D(n3), P(n3)) : p(o3) ? n3.state = w.ATTRIB_NAME_SAW_WHITE : y(f, o3) ? n3.attribName += o3 : x(n3, "Invalid attribute name");
                  continue;
                case w.ATTRIB_NAME_SAW_WHITE:
                  if ("=" === o3)
                    n3.state = w.ATTRIB_VALUE;
                  else {
                    if (p(o3))
                      continue;
                    x(n3, "Attribute without value"), n3.tag.attributes[n3.attribName] = "", n3.attribValue = "", I(n3, "onattribute", { name: n3.attribName, value: "" }), n3.attribName = "", ">" === o3 ? P(n3) : y(l, o3) ? (n3.attribName = o3, n3.state = w.ATTRIB_NAME) : (x(n3, "Invalid attribute name"), n3.state = w.ATTRIB);
                  }
                  continue;
                case w.ATTRIB_VALUE:
                  if (p(o3))
                    continue;
                  g(o3) ? (n3.q = o3, n3.state = w.ATTRIB_VALUE_QUOTED) : (x(n3, "Unquoted attribute value"), n3.state = w.ATTRIB_VALUE_UNQUOTED, n3.attribValue = o3);
                  continue;
                case w.ATTRIB_VALUE_QUOTED:
                  if (o3 !== n3.q) {
                    "&" === o3 ? n3.state = w.ATTRIB_VALUE_ENTITY_Q : n3.attribValue += o3;
                    continue;
                  }
                  D(n3), n3.q = "", n3.state = w.ATTRIB_VALUE_CLOSED;
                  continue;
                case w.ATTRIB_VALUE_CLOSED:
                  p(o3) ? n3.state = w.ATTRIB : ">" === o3 ? P(n3) : "/" === o3 ? n3.state = w.OPEN_TAG_SLASH : y(l, o3) ? (x(n3, "No whitespace between attributes"), n3.attribName = o3, n3.attribValue = "", n3.state = w.ATTRIB_NAME) : x(n3, "Invalid attribute name");
                  continue;
                case w.ATTRIB_VALUE_UNQUOTED:
                  if (!m(o3)) {
                    "&" === o3 ? n3.state = w.ATTRIB_VALUE_ENTITY_U : n3.attribValue += o3;
                    continue;
                  }
                  D(n3), ">" === o3 ? P(n3) : n3.state = w.ATTRIB;
                  continue;
                case w.CLOSE_TAG:
                  if (n3.tagName)
                    ">" === o3 ? R(n3) : y(f, o3) ? n3.tagName += o3 : n3.script ? (n3.script += "</" + n3.tagName, n3.tagName = "", n3.state = w.SCRIPT) : (p(o3) || x(n3, "Invalid tagname in closing tag"), n3.state = w.CLOSE_TAG_SAW_WHITE);
                  else {
                    if (p(o3))
                      continue;
                    v(l, o3) ? n3.script ? (n3.script += "</" + o3, n3.state = w.SCRIPT) : x(n3, "Invalid tagname in closing tag.") : n3.tagName = o3;
                  }
                  continue;
                case w.CLOSE_TAG_SAW_WHITE:
                  if (p(o3))
                    continue;
                  ">" === o3 ? R(n3) : x(n3, "Invalid characters in closing tag");
                  continue;
                case w.TEXT_ENTITY:
                case w.ATTRIB_VALUE_ENTITY_Q:
                case w.ATTRIB_VALUE_ENTITY_U:
                  var u2, c2;
                  switch (n3.state) {
                    case w.TEXT_ENTITY:
                      u2 = w.TEXT, c2 = "textNode";
                      break;
                    case w.ATTRIB_VALUE_ENTITY_Q:
                      u2 = w.ATTRIB_VALUE_QUOTED, c2 = "attribValue";
                      break;
                    case w.ATTRIB_VALUE_ENTITY_U:
                      u2 = w.ATTRIB_VALUE_UNQUOTED, c2 = "attribValue";
                  }
                  ";" === o3 ? (n3[c2] += L(n3), n3.entity = "", n3.state = u2) : y(n3.entity.length ? d : h, o3) ? n3.entity += o3 : (x(n3, "Invalid character in entity name"), n3[c2] += "&" + n3.entity + o3, n3.entity = "", n3.state = u2);
                  continue;
                default:
                  throw new Error(n3, "Unknown state: " + n3.state);
              }
            return n3.position >= n3.bufferCheckPosition && function(e5) {
              for (var n4 = Math.max(t3.MAX_BUFFER_LENGTH, 10), i4 = 0, o4 = 0, a3 = r2.length; o4 < a3; o4++) {
                var s3 = e5[r2[o4]].length;
                if (s3 > n4)
                  switch (r2[o4]) {
                    case "textNode":
                      _2(e5);
                      break;
                    case "cdata":
                      I(e5, "oncdata", e5.cdata), e5.cdata = "";
                      break;
                    case "script":
                      I(e5, "onscript", e5.script), e5.script = "";
                      break;
                    default:
                      C(e5, "Max buffer length exceeded: " + r2[o4]);
                  }
                i4 = Math.max(i4, s3);
              }
              var u3 = t3.MAX_BUFFER_LENGTH - i4;
              e5.bufferCheckPosition = u3 + e5.position;
            }(n3), n3;
          }, resume: function() {
            return this.error = null, this;
          }, close: function() {
            return this.write(null);
          }, flush: function() {
            var t4;
            _2(t4 = this), "" !== t4.cdata && (I(t4, "oncdata", t4.cdata), t4.cdata = ""), "" !== t4.script && (I(t4, "onscript", t4.script), t4.script = "");
          } };
          try {
            e3 = n2(761).F;
          } catch (t4) {
            e3 = function() {
            };
          }
          var o2 = t3.EVENTS.filter(function(t4) {
            return "error" !== t4 && "end" !== t4;
          });
          function a(t4, n3) {
            if (!(this instanceof a))
              return new a(t4, n3);
            e3.apply(this), this._parser = new i2(t4, n3), this.writable = true, this.readable = true;
            var r3 = this;
            this._parser.onend = function() {
              r3.emit("end");
            }, this._parser.onerror = function(t5) {
              r3.emit("error", t5), r3._parser.error = null;
            }, this._decoder = null, o2.forEach(function(t5) {
              Object.defineProperty(r3, "on" + t5, { get: function() {
                return r3._parser["on" + t5];
              }, set: function(e4) {
                if (!e4)
                  return r3.removeAllListeners(t5), r3._parser["on" + t5] = e4, e4;
                r3.on(t5, e4);
              }, enumerable: true, configurable: false });
            });
          }
          a.prototype = Object.create(e3.prototype, { constructor: { value: a } }), a.prototype.write = function(t4) {
            if ("function" == typeof Buffer && "function" == typeof Buffer.isBuffer && Buffer.isBuffer(t4)) {
              if (!this._decoder) {
                var e4 = n2(214).s;
                this._decoder = new e4("utf8");
              }
              t4 = this._decoder.write(t4);
            }
            return this._parser.write(t4.toString()), this.emit("data", t4), true;
          }, a.prototype.end = function(t4) {
            return t4 && t4.length && this.write(t4), this._parser.end(), true;
          }, a.prototype.on = function(t4, n3) {
            var r3 = this;
            return r3._parser["on" + t4] || -1 === o2.indexOf(t4) || (r3._parser["on" + t4] = function() {
              var e4 = 1 === arguments.length ? [arguments[0]] : Array.apply(null, arguments);
              e4.splice(0, 0, t4), r3.emit.apply(r3, e4);
            }), e3.prototype.on.call(r3, t4, n3);
          };
          var s = "http://www.w3.org/XML/1998/namespace", u = "http://www.w3.org/2000/xmlns/", c = { xml: s, xmlns: u }, l = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, f = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/, h = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, d = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;
          function p(t4) {
            return " " === t4 || "\n" === t4 || "\r" === t4 || "	" === t4;
          }
          function g(t4) {
            return '"' === t4 || "'" === t4;
          }
          function m(t4) {
            return ">" === t4 || p(t4);
          }
          function y(t4, e4) {
            return t4.test(e4);
          }
          function v(t4, e4) {
            return !y(t4, e4);
          }
          var b, T, E, w = 0;
          for (var N in t3.STATE = { BEGIN: w++, BEGIN_WHITESPACE: w++, TEXT: w++, TEXT_ENTITY: w++, OPEN_WAKA: w++, SGML_DECL: w++, SGML_DECL_QUOTED: w++, DOCTYPE: w++, DOCTYPE_QUOTED: w++, DOCTYPE_DTD: w++, DOCTYPE_DTD_QUOTED: w++, COMMENT_STARTING: w++, COMMENT: w++, COMMENT_ENDING: w++, COMMENT_ENDED: w++, CDATA: w++, CDATA_ENDING: w++, CDATA_ENDING_2: w++, PROC_INST: w++, PROC_INST_BODY: w++, PROC_INST_ENDING: w++, OPEN_TAG: w++, OPEN_TAG_SLASH: w++, ATTRIB: w++, ATTRIB_NAME: w++, ATTRIB_NAME_SAW_WHITE: w++, ATTRIB_VALUE: w++, ATTRIB_VALUE_QUOTED: w++, ATTRIB_VALUE_CLOSED: w++, ATTRIB_VALUE_UNQUOTED: w++, ATTRIB_VALUE_ENTITY_Q: w++, ATTRIB_VALUE_ENTITY_U: w++, CLOSE_TAG: w++, CLOSE_TAG_SAW_WHITE: w++, SCRIPT: w++, SCRIPT_ENDING: w++ }, t3.XML_ENTITIES = { amp: "&", gt: ">", lt: "<", quot: '"', apos: "'" }, t3.ENTITIES = { amp: "&", gt: ">", lt: "<", quot: '"', apos: "'", AElig: 198, Aacute: 193, Acirc: 194, Agrave: 192, Aring: 197, Atilde: 195, Auml: 196, Ccedil: 199, ETH: 208, Eacute: 201, Ecirc: 202, Egrave: 200, Euml: 203, Iacute: 205, Icirc: 206, Igrave: 204, Iuml: 207, Ntilde: 209, Oacute: 211, Ocirc: 212, Ograve: 210, Oslash: 216, Otilde: 213, Ouml: 214, THORN: 222, Uacute: 218, Ucirc: 219, Ugrave: 217, Uuml: 220, Yacute: 221, aacute: 225, acirc: 226, aelig: 230, agrave: 224, aring: 229, atilde: 227, auml: 228, ccedil: 231, eacute: 233, ecirc: 234, egrave: 232, eth: 240, euml: 235, iacute: 237, icirc: 238, igrave: 236, iuml: 239, ntilde: 241, oacute: 243, ocirc: 244, ograve: 242, oslash: 248, otilde: 245, ouml: 246, szlig: 223, thorn: 254, uacute: 250, ucirc: 251, ugrave: 249, uuml: 252, yacute: 253, yuml: 255, copy: 169, reg: 174, nbsp: 160, iexcl: 161, cent: 162, pound: 163, curren: 164, yen: 165, brvbar: 166, sect: 167, uml: 168, ordf: 170, laquo: 171, not: 172, shy: 173, macr: 175, deg: 176, plusmn: 177, sup1: 185, sup2: 178, sup3: 179, acute: 180, micro: 181, para: 182, middot: 183, cedil: 184, ordm: 186, raquo: 187, frac14: 188, frac12: 189, frac34: 190, iquest: 191, times: 215, divide: 247, OElig: 338, oelig: 339, Scaron: 352, scaron: 353, Yuml: 376, fnof: 402, circ: 710, tilde: 732, Alpha: 913, Beta: 914, Gamma: 915, Delta: 916, Epsilon: 917, Zeta: 918, Eta: 919, Theta: 920, Iota: 921, Kappa: 922, Lambda: 923, Mu: 924, Nu: 925, Xi: 926, Omicron: 927, Pi: 928, Rho: 929, Sigma: 931, Tau: 932, Upsilon: 933, Phi: 934, Chi: 935, Psi: 936, Omega: 937, alpha: 945, beta: 946, gamma: 947, delta: 948, epsilon: 949, zeta: 950, eta: 951, theta: 952, iota: 953, kappa: 954, lambda: 955, mu: 956, nu: 957, xi: 958, omicron: 959, pi: 960, rho: 961, sigmaf: 962, sigma: 963, tau: 964, upsilon: 965, phi: 966, chi: 967, psi: 968, omega: 969, thetasym: 977, upsih: 978, piv: 982, ensp: 8194, emsp: 8195, thinsp: 8201, zwnj: 8204, zwj: 8205, lrm: 8206, rlm: 8207, ndash: 8211, mdash: 8212, lsquo: 8216, rsquo: 8217, sbquo: 8218, ldquo: 8220, rdquo: 8221, bdquo: 8222, dagger: 8224, Dagger: 8225, bull: 8226, hellip: 8230, permil: 8240, prime: 8242, Prime: 8243, lsaquo: 8249, rsaquo: 8250, oline: 8254, frasl: 8260, euro: 8364, image: 8465, weierp: 8472, real: 8476, trade: 8482, alefsym: 8501, larr: 8592, uarr: 8593, rarr: 8594, darr: 8595, harr: 8596, crarr: 8629, lArr: 8656, uArr: 8657, rArr: 8658, dArr: 8659, hArr: 8660, forall: 8704, part: 8706, exist: 8707, empty: 8709, nabla: 8711, isin: 8712, notin: 8713, ni: 8715, prod: 8719, sum: 8721, minus: 8722, lowast: 8727, radic: 8730, prop: 8733, infin: 8734, ang: 8736, and: 8743, or: 8744, cap: 8745, cup: 8746, int: 8747, there4: 8756, sim: 8764, cong: 8773, asymp: 8776, ne: 8800, equiv: 8801, le: 8804, ge: 8805, sub: 8834, sup: 8835, nsub: 8836, sube: 8838, supe: 8839, oplus: 8853, otimes: 8855, perp: 8869, sdot: 8901, lceil: 8968, rceil: 8969, lfloor: 8970, rfloor: 8971, lang: 9001, rang: 9002, loz: 9674, spades: 9824, clubs: 9827, hearts: 9829, diams: 9830 }, Object.keys(t3.ENTITIES).forEach(function(e4) {
            var n3 = t3.ENTITIES[e4], r3 = "number" == typeof n3 ? String.fromCharCode(n3) : n3;
            t3.ENTITIES[e4] = r3;
          }), t3.STATE)
            t3.STATE[t3.STATE[N]] = N;
          function A(t4, e4, n3) {
            t4[e4] && t4[e4](n3);
          }
          function I(t4, e4, n3) {
            t4.textNode && _2(t4), A(t4, e4, n3);
          }
          function _2(t4) {
            t4.textNode = B(t4.opt, t4.textNode), t4.textNode && A(t4, "ontext", t4.textNode), t4.textNode = "";
          }
          function B(t4, e4) {
            return t4.trim && (e4 = e4.trim()), t4.normalize && (e4 = e4.replace(/\s+/g, " ")), e4;
          }
          function C(t4, e4) {
            return _2(t4), t4.trackPosition && (e4 += "\nLine: " + t4.line + "\nColumn: " + t4.column + "\nChar: " + t4.c), e4 = new Error(e4), t4.error = e4, A(t4, "onerror", e4), t4;
          }
          function O(t4) {
            return t4.sawRoot && !t4.closedRoot && x(t4, "Unclosed root tag"), t4.state !== w.BEGIN && t4.state !== w.BEGIN_WHITESPACE && t4.state !== w.TEXT && C(t4, "Unexpected end"), _2(t4), t4.c = "", t4.closed = true, A(t4, "onend"), i2.call(t4, t4.strict, t4.opt), t4;
          }
          function x(t4, e4) {
            if ("object" != typeof t4 || !(t4 instanceof i2))
              throw new Error("bad call to strictFail");
            t4.strict && C(t4, e4);
          }
          function S(t4) {
            t4.strict || (t4.tagName = t4.tagName[t4.looseCase]());
            var e4 = t4.tags[t4.tags.length - 1] || t4, n3 = t4.tag = { name: t4.tagName, attributes: {} };
            t4.opt.xmlns && (n3.ns = e4.ns), t4.attribList.length = 0, I(t4, "onopentagstart", n3);
          }
          function U(t4, e4) {
            var n3 = t4.indexOf(":") < 0 ? ["", t4] : t4.split(":"), r3 = n3[0], i3 = n3[1];
            return e4 && "xmlns" === t4 && (r3 = "xmlns", i3 = ""), { prefix: r3, local: i3 };
          }
          function D(t4) {
            if (t4.strict || (t4.attribName = t4.attribName[t4.looseCase]()), -1 !== t4.attribList.indexOf(t4.attribName) || t4.tag.attributes.hasOwnProperty(t4.attribName))
              t4.attribName = t4.attribValue = "";
            else {
              if (t4.opt.xmlns) {
                var e4 = U(t4.attribName, true), n3 = e4.prefix, r3 = e4.local;
                if ("xmlns" === n3)
                  if ("xml" === r3 && t4.attribValue !== s)
                    x(t4, "xml: prefix must be bound to " + s + "\nActual: " + t4.attribValue);
                  else if ("xmlns" === r3 && t4.attribValue !== u)
                    x(t4, "xmlns: prefix must be bound to " + u + "\nActual: " + t4.attribValue);
                  else {
                    var i3 = t4.tag, o3 = t4.tags[t4.tags.length - 1] || t4;
                    i3.ns === o3.ns && (i3.ns = Object.create(o3.ns)), i3.ns[r3] = t4.attribValue;
                  }
                t4.attribList.push([t4.attribName, t4.attribValue]);
              } else
                t4.tag.attributes[t4.attribName] = t4.attribValue, I(t4, "onattribute", { name: t4.attribName, value: t4.attribValue });
              t4.attribName = t4.attribValue = "";
            }
          }
          function P(t4, e4) {
            if (t4.opt.xmlns) {
              var n3 = t4.tag, r3 = U(t4.tagName);
              n3.prefix = r3.prefix, n3.local = r3.local, n3.uri = n3.ns[r3.prefix] || "", n3.prefix && !n3.uri && (x(t4, "Unbound namespace prefix: " + JSON.stringify(t4.tagName)), n3.uri = r3.prefix);
              var i3 = t4.tags[t4.tags.length - 1] || t4;
              n3.ns && i3.ns !== n3.ns && Object.keys(n3.ns).forEach(function(e5) {
                I(t4, "onopennamespace", { prefix: e5, uri: n3.ns[e5] });
              });
              for (var o3 = 0, a2 = t4.attribList.length; o3 < a2; o3++) {
                var s2 = t4.attribList[o3], u2 = s2[0], c2 = s2[1], l2 = U(u2, true), f2 = l2.prefix, h2 = l2.local, d2 = "" === f2 ? "" : n3.ns[f2] || "", p2 = { name: u2, value: c2, prefix: f2, local: h2, uri: d2 };
                f2 && "xmlns" !== f2 && !d2 && (x(t4, "Unbound namespace prefix: " + JSON.stringify(f2)), p2.uri = f2), t4.tag.attributes[u2] = p2, I(t4, "onattribute", p2);
              }
              t4.attribList.length = 0;
            }
            t4.tag.isSelfClosing = !!e4, t4.sawRoot = true, t4.tags.push(t4.tag), I(t4, "onopentag", t4.tag), e4 || (t4.noscript || "script" !== t4.tagName.toLowerCase() ? t4.state = w.TEXT : t4.state = w.SCRIPT, t4.tag = null, t4.tagName = ""), t4.attribName = t4.attribValue = "", t4.attribList.length = 0;
          }
          function R(t4) {
            if (!t4.tagName)
              return x(t4, "Weird empty close tag."), t4.textNode += "</>", void (t4.state = w.TEXT);
            if (t4.script) {
              if ("script" !== t4.tagName)
                return t4.script += "</" + t4.tagName + ">", t4.tagName = "", void (t4.state = w.SCRIPT);
              I(t4, "onscript", t4.script), t4.script = "";
            }
            var e4 = t4.tags.length, n3 = t4.tagName;
            t4.strict || (n3 = n3[t4.looseCase]());
            for (var r3 = n3; e4-- && t4.tags[e4].name !== r3; )
              x(t4, "Unexpected close tag");
            if (e4 < 0)
              return x(t4, "Unmatched closing tag: " + t4.tagName), t4.textNode += "</" + t4.tagName + ">", void (t4.state = w.TEXT);
            t4.tagName = n3;
            for (var i3 = t4.tags.length; i3-- > e4; ) {
              var o3 = t4.tag = t4.tags.pop();
              t4.tagName = t4.tag.name, I(t4, "onclosetag", t4.tagName);
              var a2 = {};
              for (var s2 in o3.ns)
                a2[s2] = o3.ns[s2];
              var u2 = t4.tags[t4.tags.length - 1] || t4;
              t4.opt.xmlns && o3.ns !== u2.ns && Object.keys(o3.ns).forEach(function(e5) {
                var n4 = o3.ns[e5];
                I(t4, "onclosenamespace", { prefix: e5, uri: n4 });
              });
            }
            0 === e4 && (t4.closedRoot = true), t4.tagName = t4.attribValue = t4.attribName = "", t4.attribList.length = 0, t4.state = w.TEXT;
          }
          function L(t4) {
            var e4, n3 = t4.entity, r3 = n3.toLowerCase(), i3 = "";
            return t4.ENTITIES[n3] ? t4.ENTITIES[n3] : t4.ENTITIES[r3] ? t4.ENTITIES[r3] : ("#" === (n3 = r3).charAt(0) && ("x" === n3.charAt(1) ? (n3 = n3.slice(2), i3 = (e4 = parseInt(n3, 16)).toString(16)) : (n3 = n3.slice(1), i3 = (e4 = parseInt(n3, 10)).toString(10))), n3 = n3.replace(/^0+/, ""), isNaN(e4) || i3.toLowerCase() !== n3 ? (x(t4, "Invalid character entity"), "&" + t4.entity + ";") : String.fromCodePoint(e4));
          }
          function F(t4, e4) {
            "<" === e4 ? (t4.state = w.OPEN_WAKA, t4.startTagPosition = t4.position) : p(e4) || (x(t4, "Non-whitespace before first tag."), t4.textNode = e4, t4.state = w.TEXT);
          }
          function M(t4, e4) {
            var n3 = "";
            return e4 < t4.length && (n3 = t4.charAt(e4)), n3;
          }
          w = t3.STATE, String.fromCodePoint || (b = String.fromCharCode, T = Math.floor, E = function() {
            var t4, e4, n3 = 16384, r3 = [], i3 = -1, o3 = arguments.length;
            if (!o3)
              return "";
            for (var a2 = ""; ++i3 < o3; ) {
              var s2 = Number(arguments[i3]);
              if (!isFinite(s2) || s2 < 0 || s2 > 1114111 || T(s2) !== s2)
                throw RangeError("Invalid code point: " + s2);
              s2 <= 65535 ? r3.push(s2) : (t4 = 55296 + ((s2 -= 65536) >> 10), e4 = s2 % 1024 + 56320, r3.push(t4, e4)), (i3 + 1 === o3 || r3.length > n3) && (a2 += b.apply(null, r3), r3.length = 0);
            }
            return a2;
          }, Object.defineProperty ? Object.defineProperty(String, "fromCodePoint", { value: E, configurable: true, writable: true }) : String.fromCodePoint = E);
        }(e2);
      }, 214: (t2, e2, n2) => {
        var r2 = n2(834).Buffer, i2 = r2.isEncoding || function(t3) {
          switch ((t3 = "" + t3) && t3.toLowerCase()) {
            case "hex":
            case "utf8":
            case "utf-8":
            case "ascii":
            case "binary":
            case "base64":
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
            case "raw":
              return true;
            default:
              return false;
          }
        };
        function o2(t3) {
          var e3;
          switch (this.encoding = function(t4) {
            var e4 = function(t5) {
              if (!t5)
                return "utf8";
              for (var e5; ; )
                switch (t5) {
                  case "utf8":
                  case "utf-8":
                    return "utf8";
                  case "ucs2":
                  case "ucs-2":
                  case "utf16le":
                  case "utf-16le":
                    return "utf16le";
                  case "latin1":
                  case "binary":
                    return "latin1";
                  case "base64":
                  case "ascii":
                  case "hex":
                    return t5;
                  default:
                    if (e5)
                      return;
                    t5 = ("" + t5).toLowerCase(), e5 = true;
                }
            }(t4);
            if ("string" != typeof e4 && (r2.isEncoding === i2 || !i2(t4)))
              throw new Error("Unknown encoding: " + t4);
            return e4 || t4;
          }(t3), this.encoding) {
            case "utf16le":
              this.text = u, this.end = c, e3 = 4;
              break;
            case "utf8":
              this.fillLast = s, e3 = 4;
              break;
            case "base64":
              this.text = l, this.end = f, e3 = 3;
              break;
            default:
              return this.write = h, void (this.end = d);
          }
          this.lastNeed = 0, this.lastTotal = 0, this.lastChar = r2.allocUnsafe(e3);
        }
        function a(t3) {
          return t3 <= 127 ? 0 : t3 >> 5 == 6 ? 2 : t3 >> 4 == 14 ? 3 : t3 >> 3 == 30 ? 4 : t3 >> 6 == 2 ? -1 : -2;
        }
        function s(t3) {
          var e3 = this.lastTotal - this.lastNeed, n3 = function(t4, e4, n4) {
            if (128 != (192 & e4[0]))
              return t4.lastNeed = 0, "�";
            if (t4.lastNeed > 1 && e4.length > 1) {
              if (128 != (192 & e4[1]))
                return t4.lastNeed = 1, "�";
              if (t4.lastNeed > 2 && e4.length > 2 && 128 != (192 & e4[2]))
                return t4.lastNeed = 2, "�";
            }
          }(this, t3);
          return void 0 !== n3 ? n3 : this.lastNeed <= t3.length ? (t3.copy(this.lastChar, e3, 0, this.lastNeed), this.lastChar.toString(this.encoding, 0, this.lastTotal)) : (t3.copy(this.lastChar, e3, 0, t3.length), void (this.lastNeed -= t3.length));
        }
        function u(t3, e3) {
          if ((t3.length - e3) % 2 == 0) {
            var n3 = t3.toString("utf16le", e3);
            if (n3) {
              var r3 = n3.charCodeAt(n3.length - 1);
              if (r3 >= 55296 && r3 <= 56319)
                return this.lastNeed = 2, this.lastTotal = 4, this.lastChar[0] = t3[t3.length - 2], this.lastChar[1] = t3[t3.length - 1], n3.slice(0, -1);
            }
            return n3;
          }
          return this.lastNeed = 1, this.lastTotal = 2, this.lastChar[0] = t3[t3.length - 1], t3.toString("utf16le", e3, t3.length - 1);
        }
        function c(t3) {
          var e3 = t3 && t3.length ? this.write(t3) : "";
          if (this.lastNeed) {
            var n3 = this.lastTotal - this.lastNeed;
            return e3 + this.lastChar.toString("utf16le", 0, n3);
          }
          return e3;
        }
        function l(t3, e3) {
          var n3 = (t3.length - e3) % 3;
          return 0 === n3 ? t3.toString("base64", e3) : (this.lastNeed = 3 - n3, this.lastTotal = 3, 1 === n3 ? this.lastChar[0] = t3[t3.length - 1] : (this.lastChar[0] = t3[t3.length - 2], this.lastChar[1] = t3[t3.length - 1]), t3.toString("base64", e3, t3.length - n3));
        }
        function f(t3) {
          var e3 = t3 && t3.length ? this.write(t3) : "";
          return this.lastNeed ? e3 + this.lastChar.toString("base64", 0, 3 - this.lastNeed) : e3;
        }
        function h(t3) {
          return t3.toString(this.encoding);
        }
        function d(t3) {
          return t3 && t3.length ? this.write(t3) : "";
        }
        e2.s = o2, o2.prototype.write = function(t3) {
          if (0 === t3.length)
            return "";
          var e3, n3;
          if (this.lastNeed) {
            if (void 0 === (e3 = this.fillLast(t3)))
              return "";
            n3 = this.lastNeed, this.lastNeed = 0;
          } else
            n3 = 0;
          return n3 < t3.length ? e3 ? e3 + this.text(t3, n3) : this.text(t3, n3) : e3 || "";
        }, o2.prototype.end = function(t3) {
          var e3 = t3 && t3.length ? this.write(t3) : "";
          return this.lastNeed ? e3 + "�" : e3;
        }, o2.prototype.text = function(t3, e3) {
          var n3 = function(t4, e4, n4) {
            var r4 = e4.length - 1;
            if (r4 < n4)
              return 0;
            var i3 = a(e4[r4]);
            return i3 >= 0 ? (i3 > 0 && (t4.lastNeed = i3 - 1), i3) : --r4 < n4 || -2 === i3 ? 0 : (i3 = a(e4[r4])) >= 0 ? (i3 > 0 && (t4.lastNeed = i3 - 2), i3) : --r4 < n4 || -2 === i3 ? 0 : (i3 = a(e4[r4])) >= 0 ? (i3 > 0 && (2 === i3 ? i3 = 0 : t4.lastNeed = i3 - 3), i3) : 0;
          }(this, t3, e3);
          if (!this.lastNeed)
            return t3.toString("utf8", e3);
          this.lastTotal = n3;
          var r3 = t3.length - (n3 - this.lastNeed);
          return t3.copy(this.lastChar, 0, r3), t3.toString("utf8", e3, r3);
        }, o2.prototype.fillLast = function(t3) {
          if (this.lastNeed <= t3.length)
            return t3.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed), this.lastChar.toString(this.encoding, 0, this.lastTotal);
          t3.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, t3.length), this.lastNeed -= t3.length;
        };
      }, 668: (t2, e2, n2) => {
        t2.exports = n2(983);
      }, 983: (t2, e2, n2) => {
        !function() {
          var e3;
          if (t2.exports && !n2.g.xmldocAssumeBrowser)
            e3 = n2(480);
          else if (!(e3 = this.sax))
            throw new Error("Expected sax to be defined. Make sure you're including sax.js before this file.");
          function r2(t3) {
            var e4 = u[u.length - 1].parser;
            this.name = t3.name, this.attr = t3.attributes, this.val = "", this.children = [], this.firstChild = null, this.lastChild = null, this.line = e4.line, this.column = e4.column, this.position = e4.position, this.startTagPosition = e4.startTagPosition;
          }
          function i2(t3) {
            this.text = t3;
          }
          function o2(t3) {
            this.cdata = t3;
          }
          function a(t3) {
            this.comment = t3;
          }
          function s(t3) {
            if (t3 && (t3 = t3.toString().trim()), !t3)
              throw new Error("No XML to parse!");
            var n3;
            this.doctype = "", this.parser = e3.parser(true), (n3 = this.parser).onopentag = c, n3.onclosetag = l, n3.ontext = f, n3.oncdata = h, n3.oncomment = d, n3.ondoctype = p, n3.onerror = g, u = [this], this.parser.write(t3), delete this.parser;
          }
          r2.prototype._addChild = function(t3) {
            this.children.push(t3), this.firstChild || (this.firstChild = t3), this.lastChild = t3;
          }, r2.prototype._opentag = function(t3) {
            var e4 = new r2(t3);
            this._addChild(e4), u.unshift(e4);
          }, r2.prototype._closetag = function() {
            u.shift();
          }, r2.prototype._text = function(t3) {
            void 0 !== this.children && (this.val += t3, this._addChild(new i2(t3)));
          }, r2.prototype._cdata = function(t3) {
            this.val += t3, this._addChild(new o2(t3));
          }, r2.prototype._comment = function(t3) {
            void 0 !== this.children && this._addChild(new a(t3));
          }, r2.prototype._error = function(t3) {
            throw t3;
          }, r2.prototype.eachChild = function(t3, e4) {
            for (var n3 = 0, r3 = this.children.length; n3 < r3; n3++)
              if ("element" === this.children[n3].type && false === t3.call(e4, this.children[n3], n3, this.children))
                return;
          }, r2.prototype.childNamed = function(t3) {
            for (var e4 = 0, n3 = this.children.length; e4 < n3; e4++) {
              var r3 = this.children[e4];
              if (r3.name === t3)
                return r3;
            }
          }, r2.prototype.childrenNamed = function(t3) {
            for (var e4 = [], n3 = 0, r3 = this.children.length; n3 < r3; n3++)
              this.children[n3].name === t3 && e4.push(this.children[n3]);
            return e4;
          }, r2.prototype.childWithAttribute = function(t3, e4) {
            for (var n3 = 0, r3 = this.children.length; n3 < r3; n3++) {
              var i3 = this.children[n3];
              if ("element" === i3.type && (e4 && i3.attr[t3] === e4 || !e4 && i3.attr[t3]))
                return i3;
            }
          }, r2.prototype.descendantsNamed = function(t3) {
            for (var e4 = [], n3 = 0, r3 = this.children.length; n3 < r3; n3++) {
              var i3 = this.children[n3];
              "element" === i3.type && (i3.name === t3 && e4.push(i3), e4 = e4.concat(i3.descendantsNamed(t3)));
            }
            return e4;
          }, r2.prototype.descendantWithPath = function(t3) {
            for (var e4 = this, n3 = t3.split("."), r3 = 0, i3 = n3.length; r3 < i3; r3++) {
              if (!e4 || "element" !== e4.type)
                return;
              e4 = e4.childNamed(n3[r3]);
            }
            return e4;
          }, r2.prototype.valueWithPath = function(t3) {
            var e4 = t3.split("@"), n3 = this.descendantWithPath(e4[0]);
            return n3 ? e4.length > 1 ? n3.attr[e4[1]] : n3.val : void 0;
          }, r2.prototype.toString = function(t3) {
            return this.toStringWithIndent("", t3);
          }, r2.prototype.toStringWithIndent = function(t3, e4) {
            var n3 = t3 + "<" + this.name, r3 = e4 && e4.compressed ? "" : "\n";
            for (var i3 in e4 && e4.preserveWhitespace, this.attr)
              Object.prototype.hasOwnProperty.call(this.attr, i3) && (n3 += " " + i3 + '="' + m(this.attr[i3]) + '"');
            if (1 === this.children.length && "element" !== this.children[0].type)
              n3 += ">" + this.children[0].toString(e4) + "</" + this.name + ">";
            else if (this.children.length) {
              n3 += ">" + r3;
              for (var o3 = t3 + (e4 && e4.compressed ? "" : "  "), a2 = 0, s2 = this.children.length; a2 < s2; a2++)
                n3 += this.children[a2].toStringWithIndent(o3, e4) + r3;
              n3 += t3 + "</" + this.name + ">";
            } else
              e4 && e4.html ? -1 !== ["area", "base", "br", "col", "embed", "frame", "hr", "img", "input", "keygen", "link", "menuitem", "meta", "param", "source", "track", "wbr"].indexOf(this.name) ? n3 += "/>" : n3 += "></" + this.name + ">" : n3 += "/>";
            return n3;
          }, i2.prototype.toString = function(t3) {
            return y(m(this.text), t3);
          }, i2.prototype.toStringWithIndent = function(t3, e4) {
            return t3 + this.toString(e4);
          }, o2.prototype.toString = function(t3) {
            return "<![CDATA[" + y(this.cdata, t3) + "]]>";
          }, o2.prototype.toStringWithIndent = function(t3, e4) {
            return t3 + this.toString(e4);
          }, a.prototype.toString = function(t3) {
            return "<!--" + y(m(this.comment), t3) + "-->";
          }, a.prototype.toStringWithIndent = function(t3, e4) {
            return t3 + this.toString(e4);
          }, r2.prototype.type = "element", i2.prototype.type = "text", o2.prototype.type = "cdata", a.prototype.type = "comment", function(t3, e4) {
            for (var n3 in e4)
              e4.hasOwnProperty(n3) && (t3[n3] = e4[n3]);
          }(s.prototype, r2.prototype), s.prototype._opentag = function(t3) {
            void 0 === this.children ? r2.call(this, t3) : r2.prototype._opentag.apply(this, arguments);
          }, s.prototype._doctype = function(t3) {
            this.doctype += t3;
          };
          var u = null;
          function c() {
            u[0] && u[0]._opentag.apply(u[0], arguments);
          }
          function l() {
            u[0] && u[0]._closetag.apply(u[0], arguments);
          }
          function f() {
            u[0] && u[0]._text.apply(u[0], arguments);
          }
          function h() {
            u[0] && u[0]._cdata.apply(u[0], arguments);
          }
          function d() {
            u[0] && u[0]._comment.apply(u[0], arguments);
          }
          function p() {
            u[0] && u[0]._doctype.apply(u[0], arguments);
          }
          function g() {
            u[0] && u[0]._error.apply(u[0], arguments);
          }
          function m(t3) {
            return t3.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&apos;").replace(/"/g, "&quot;");
          }
          function y(t3, e4) {
            var n3 = t3;
            return e4 && e4.trimmed && t3.length > 25 && (n3 = n3.substring(0, 25).trim() + "…"), e4 && e4.preserveWhitespace || (n3 = n3.trim()), n3;
          }
          t2.exports && !n2.g.xmldocAssumeBrowser ? (t2.exports.XmlDocument = s, t2.exports.XmlElement = r2, t2.exports.XmlTextNode = i2, t2.exports.XmlCDataNode = o2, t2.exports.XmlCommentNode = a) : (this.XmlDocument = s, this.XmlElement = r2, this.XmlTextNode = i2, this.XmlCDataNode = o2, this.XmlCommentNode = a);
        }();
      }, 761: (t2, e2, n2) => {
        n2.d(e2, { F: () => r2 });
        const r2 = function() {
        };
      } }, e = {};
      function n(r2) {
        var i2 = e[r2];
        if (void 0 !== i2)
          return i2.exports;
        var o2 = e[r2] = { exports: {} };
        return t[r2](o2, o2.exports, n), o2.exports;
      }
      n.n = (t2) => {
        var e2 = t2 && t2.__esModule ? () => t2.default : () => t2;
        return n.d(e2, { a: e2 }), e2;
      }, n.d = (t2, e2) => {
        for (var r2 in e2)
          n.o(e2, r2) && !n.o(t2, r2) && Object.defineProperty(t2, r2, { enumerable: true, get: e2[r2] });
      }, n.g = function() {
        if ("object" == typeof globalThis)
          return globalThis;
        try {
          return this || new Function("return this")();
        } catch (t2) {
          if ("object" == typeof window)
            return window;
        }
      }(), n.o = (t2, e2) => Object.prototype.hasOwnProperty.call(t2, e2), n.r = (t2) => {
        "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(t2, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(t2, "__esModule", { value: true });
      };
      var r = {};
      (() => {
        n.r(r), n.d(r, { Report: () => c, createArchiveFromArrayBufferList: () => S, createArchiveFromJszip: () => O, createArchiveFromText: () => B, createArchiveFromUrls: () => I, getArchiveOpfInfo: () => l, getManifestFromArchive: () => E, getResourceFromArchive: () => p, xmldoc: () => e2() });
        var t2 = n(668), e2 = n.n(t2), i2 = function(t3, e3, n2, r2) {
          return new (n2 || (n2 = Promise))(function(i3, o3) {
            function a2(t4) {
              try {
                u2(r2.next(t4));
              } catch (t5) {
                o3(t5);
              }
            }
            function s2(t4) {
              try {
                u2(r2.throw(t4));
              } catch (t5) {
                o3(t5);
              }
            }
            function u2(t4) {
              var e4;
              t4.done ? i3(t4.value) : (e4 = t4.value, e4 instanceof n2 ? e4 : new n2(function(t5) {
                t5(e4);
              })).then(a2, s2);
            }
            u2((r2 = r2.apply(t3, e3 || [])).next());
          });
        };
        const o2 = (t3, { opfBasePath: e3, baseUrl: n2 }) => {
          const r2 = { contents: [], path: "", href: "", title: "" };
          let i3 = t3.childNamed("span") || t3.childNamed("a");
          r2.title = (null == i3 ? void 0 : i3.attr.title) || (null == i3 ? void 0 : i3.val.trim()) || r2.title;
          let a2 = null == i3 ? void 0 : i3.name;
          "a" !== a2 && (i3 = t3.descendantWithPath(`${a2}.a`), i3 && (a2 = i3.name.toLowerCase())), "a" === a2 && (null == i3 ? void 0 : i3.attr.href) && (r2.path = e3 ? `${e3}/${i3.attr.href}` : `${i3.attr.href}`, r2.href = e3 ? `${n2}/${e3}/${i3.attr.href}` : `${n2}/${i3.attr.href}`);
          const s2 = t3.childNamed("ol");
          if (s2) {
            const t4 = s2.childrenNamed("li");
            t4 && t4.length > 0 && (r2.contents = t4.map((t5) => o2(t5, { opfBasePath: e3, baseUrl: n2 })));
          }
          return r2;
        }, a = (t3, { opfBasePath: e3, baseUrl: n2, prefix: r2 }) => {
          var i3, o3;
          const s2 = (null === (i3 = null == t3 ? void 0 : t3.childNamed(`${r2}content`)) || void 0 === i3 ? void 0 : i3.attr.src) || "", u2 = { title: (null === (o3 = null == t3 ? void 0 : t3.descendantWithPath(`${r2}navLabel.${r2}text`)) || void 0 === o3 ? void 0 : o3.val) || "", path: e3 ? `${e3}/${s2}` : `${s2}`, href: e3 ? `${n2}/${e3}/${s2}` : `${n2}/${s2}`, contents: [] }, c2 = t3.childrenNamed(`${r2}navPoint`);
          return c2 && c2.length > 0 && (u2.contents = c2.map((t4) => a(t4, { opfBasePath: e3, baseUrl: n2, prefix: r2 }))), u2;
        };
        var s = function(t3, e3, n2, r2) {
          return new (n2 || (n2 = Promise))(function(i3, o3) {
            function a2(t4) {
              try {
                u2(r2.next(t4));
              } catch (t5) {
                o3(t5);
              }
            }
            function s2(t4) {
              try {
                u2(r2.throw(t4));
              } catch (t5) {
                o3(t5);
              }
            }
            function u2(t4) {
              var e4;
              t4.done ? i3(t4.value) : (e4 = t4.value, e4 instanceof n2 ? e4 : new n2(function(t5) {
                t5(e4);
              })).then(a2, s2);
            }
            u2((r2 = r2.apply(t3, e3 || [])).next());
          });
        };
        let u = false;
        const c = { enable: (t3) => {
          u = t3;
        }, log: (...t3) => {
          u && console.log("[prose-reader-streamer]", ...t3);
        }, warn: (...t3) => {
          u && console.warn("[prose-reader-streamer]", ...t3);
        }, error: (...t3) => {
          console.error(...t3);
        }, time: (t3) => {
          u && console.time(`[prose-reader-streamer] [metric] ${t3}`);
        }, timeEnd: (t3) => {
          u && console.timeEnd(`[prose-reader-streamer] [metric] ${t3}`);
        }, metric: (t3, e3 = 1 / 0) => {
          const n2 = "number" == typeof t3 ? t3 : t3.duration;
          u && (t3.duration <= e3 ? console.log("[prose-reader-streamer] [metric] ", `${t3.name} took ${n2}ms`) : console.warn("[prose-reader-streamer] [metric] ", `${t3.name} took ${t3.duration}ms which is above the ${e3}ms target for this function`));
        }, measurePerformance: (t3, e3 = 10, n2) => (...r2) => {
          const i3 = performance.now(), o3 = n2(...r2);
          if (o3 && o3.then)
            return o3.then((n3) => {
              const r3 = performance.now();
              return c.metric({ name: t3, duration: r3 - i3 }, e3), n3;
            });
          const a2 = performance.now();
          return c.metric({ name: t3, duration: a2 - i3 }, e3), o3;
        } }, l = (t3) => {
          const e3 = Object.values(t3.files).filter((t4) => !t4.dir), n2 = e3.find((t4) => t4.uri.endsWith(".opf"));
          return { data: n2, basePath: (null == n2 ? void 0 : n2.uri.substring(0, n2.uri.lastIndexOf("/"))) || "" };
        };
        const f = (t3) => {
          var e3;
          const n2 = t3.childNamed("manifest");
          return (null === (e3 = null == n2 ? void 0 : n2.childrenNamed("item")) || void 0 === e3 ? void 0 : e3.map((t4) => ({ href: t4.attr.href || "", id: t4.attr.id || "", mediaType: t4.attr["media-type"] }))) || [];
        }, h = ({ archive: t3, baseUrl: n2 }) => (r2) => {
          return u2 = void 0, h2 = void 0, p2 = function* () {
            var u3;
            const { data: h3, basePath: d3 } = l(t3) || {}, p3 = yield ((t4) => s(void 0, void 0, void 0, function* () {
              const n3 = { renditionLayout: void 0 };
              return yield Promise.all(t4.files.map((t5) => s(void 0, void 0, void 0, function* () {
                var r3, i3;
                if (t5.uri.endsWith("com.kobobooks.display-options.xml")) {
                  const o3 = null === (r3 = new (e2()).XmlDocument(yield t5.string()).childNamed("platform")) || void 0 === r3 ? void 0 : r3.childNamed("option");
                  "fixed-layout" === (null === (i3 = null == o3 ? void 0 : o3.attr) || void 0 === i3 ? void 0 : i3.name) && "true" === o3.val && (n3.renditionLayout = "pre-paginated");
                }
              }))), n3;
            }))(t3);
            if (!h3)
              return r2;
            const g2 = yield h3.string();
            c.log(g2, p3);
            const m2 = new (e2()).XmlDocument(g2), y2 = (yield ((t4, n3, { baseUrl: r3 }) => i2(void 0, void 0, void 0, function* () {
              const { basePath: s2 } = l(n3) || {};
              return (yield (({ opfData: t5, opfBasePath: n4, baseUrl: r4, archive: o3 }) => i2(void 0, void 0, void 0, function* () {
                var i3;
                const s3 = t5.childNamed("spine"), u4 = s3 && s3.attr.toc;
                if (u4) {
                  const s4 = null === (i3 = t5.childNamed("manifest")) || void 0 === i3 ? void 0 : i3.childrenNamed("item").find((t6) => t6.attr.id === u4);
                  if (s4) {
                    const t6 = `${n4}${"" === n4 ? "" : "/"}${s4.attr.href}`, i4 = Object.values(o3.files).find((e3) => e3.uri.endsWith(t6));
                    if (i4)
                      return ((t7, { opfBasePath: e3, baseUrl: n5 }) => {
                        var r5;
                        const i5 = [], o4 = t7.name;
                        let s5 = "";
                        return -1 !== o4.indexOf(":") && (s5 = o4.split(":")[0] + ":"), null === (r5 = t7.childNamed(`${s5}navMap`)) || void 0 === r5 || r5.childrenNamed(`${s5}navPoint`).forEach((t8) => i5.push(a(t8, { opfBasePath: e3, baseUrl: n5, prefix: s5 }))), i5;
                      })(new (e2()).XmlDocument(yield i4.string()), { opfBasePath: n4, baseUrl: r4 });
                  }
                }
              }))({ opfData: t4, opfBasePath: s2, archive: n3, baseUrl: r3 })) || (yield ((t5, n4, { opfBasePath: r4, baseUrl: a2 }) => i2(void 0, void 0, void 0, function* () {
                var i3;
                const s3 = null === (i3 = t5.childNamed("manifest")) || void 0 === i3 ? void 0 : i3.childrenNamed("item").find((t6) => "nav" === t6.attr.properties);
                if (s3) {
                  const t6 = Object.values(n4.files).find((t7) => t7.uri.endsWith(s3.attr.href || ""));
                  if (t6)
                    return ((t7, { opfBasePath: e3, baseUrl: n5 }) => {
                      var r5, i4;
                      const a3 = [];
                      let s4;
                      return t7.descendantWithPath("body.nav.ol") ? s4 = null === (r5 = t7.descendantWithPath("body.nav.ol")) || void 0 === r5 ? void 0 : r5.children : t7.descendantWithPath("body.section.nav.ol") && (s4 = null === (i4 = t7.descendantWithPath("body.section.nav.ol")) || void 0 === i4 ? void 0 : i4.children), s4 && s4.length > 0 && s4.filter((t8) => "li" === t8.name).forEach((t8) => a3.push(o2(t8, { opfBasePath: e3, baseUrl: n5 }))), a3;
                    })(new (e2()).XmlDocument(yield t6.string()), { opfBasePath: r4, baseUrl: a2 });
                }
              }))(t4, n3, { opfBasePath: s2, baseUrl: r3 }));
            }))(m2, t3, { baseUrl: n2 })) || [], v2 = m2.childNamed("metadata"), b2 = m2.childNamed("manifest"), T2 = m2.childNamed("spine"), E2 = m2.childNamed("guide"), w2 = null == v2 ? void 0 : v2.childNamed("dc:title"), N2 = (null == v2 ? void 0 : v2.childrenNamed("meta")) || [], A2 = N2.find((t4) => "rendition:layout" === t4.attr.property), I2 = N2.find((t4) => "rendition:flow" === t4.attr.property), _3 = N2.find((t4) => "rendition:spread" === t4.attr.property), B2 = null == A2 ? void 0 : A2.val, C2 = null == I2 ? void 0 : I2.val, O2 = null == _3 ? void 0 : _3.val, x2 = (null == w2 ? void 0 : w2.val) || (null === (u3 = t3.files.find(({ dir: t4 }) => t4)) || void 0 === u3 ? void 0 : u3.basename) || "", S2 = null == T2 ? void 0 : T2.attr["page-progression-direction"], U = null == T2 ? void 0 : T2.childrenNamed("itemref").map((t4) => t4.attr.idref), D = (null == b2 ? void 0 : b2.childrenNamed("item").filter((t4) => U.includes(t4.attr.id || ""))) || [], P = t3.files.filter((t4) => D.find((e3) => d3 ? `${d3}/${e3.attr.href}` === t4.uri : `${e3.attr.href}` === t4.uri)).reduce((t4, e3) => e3.size + t4, 0);
            return { filename: t3.filename, nav: { toc: y2 }, renditionLayout: B2 || p3.renditionLayout || "reflowable", renditionFlow: C2 || "auto", renditionSpread: O2, title: x2, readingDirection: S2 || "ltr", spineItems: (null == T2 ? void 0 : T2.childrenNamed("itemref").map((e3) => {
              var r3, i3, o3;
              const a2 = null == b2 ? void 0 : b2.childrenNamed("item").find((t4) => t4.attr.id === (null == e3 ? void 0 : e3.attr.idref)), s2 = (null == a2 ? void 0 : a2.attr.href) || "", u4 = (null === (r3 = null == e3 ? void 0 : e3.attr.properties) || void 0 === r3 ? void 0 : r3.split(" ")) || [], c2 = (null === (i3 = t3.files.find((t4) => t4.uri.endsWith(s2))) || void 0 === i3 ? void 0 : i3.size) || 0;
              return Object.assign(Object.assign({ id: (null == a2 ? void 0 : a2.attr.id) || "", path: d3 ? `${d3}/${null == a2 ? void 0 : a2.attr.href}` : `${null == a2 ? void 0 : a2.attr.href}`, href: (null === (o3 = null == a2 ? void 0 : a2.attr.href) || void 0 === o3 ? void 0 : o3.startsWith("https://")) ? null == a2 ? void 0 : a2.attr.href : d3 ? `${n2}/${d3}/${null == a2 ? void 0 : a2.attr.href}` : `${n2}/${null == a2 ? void 0 : a2.attr.href}`, renditionLayout: B2 || "reflowable" }, u4.find((t4) => "rendition:layout-reflowable" === t4) && { renditionLayout: "reflowable" }), { progressionWeight: c2 / P, pageSpreadLeft: u4.some((t4) => "page-spread-left" === t4) || void 0, pageSpreadRight: u4.some((t4) => "page-spread-right" === t4) || void 0, mediaType: null == a2 ? void 0 : a2.attr["media-type"] });
            })) || [], items: f(m2), guide: null == E2 ? void 0 : E2.childrenNamed("reference").map((t4) => ({ href: t4.attr.href || "", title: t4.attr.title || "", type: t4.attr.type })) };
          }, new ((d2 = void 0) || (d2 = Promise))(function(t4, e3) {
            function n3(t5) {
              try {
                i3(p2.next(t5));
              } catch (t6) {
                e3(t6);
              }
            }
            function r3(t5) {
              try {
                i3(p2.throw(t5));
              } catch (t6) {
                e3(t6);
              }
            }
            function i3(e4) {
              var i4;
              e4.done ? t4(e4.value) : (i4 = e4.value, i4 instanceof d2 ? i4 : new d2(function(t5) {
                t5(i4);
              })).then(n3, r3);
            }
            i3((p2 = p2.apply(u2, h2 || [])).next());
          });
          var u2, h2, d2, p2;
        };
        var d = function(t3, e3, n2, r2) {
          return new (n2 || (n2 = Promise))(function(i3, o3) {
            function a2(t4) {
              try {
                u2(r2.next(t4));
              } catch (t5) {
                o3(t5);
              }
            }
            function s2(t4) {
              try {
                u2(r2.throw(t4));
              } catch (t5) {
                o3(t5);
              }
            }
            function u2(t4) {
              var e4;
              t4.done ? i3(t4.value) : (e4 = t4.value, e4 instanceof n2 ? e4 : new n2(function(t5) {
                t5(e4);
              })).then(a2, s2);
            }
            u2((r2 = r2.apply(t3, e3 || [])).next());
          });
        };
        const p = (t3, e3) => d(void 0, void 0, void 0, function* () {
          const n2 = Object.values(t3.files).find((t4) => t4.uri === e3), r2 = yield g(t3, e3);
          if (!n2)
            throw new Error("no file found");
          const i3 = yield n2.blob();
          return new Response(i3, { headers: Object.assign(Object.assign(Object.assign({}, i3.type && { "Content-Type": i3.type }), n2.encodingFormat && { "Content-Type": n2.encodingFormat }), r2.mediaType && { "Content-Type": r2.mediaType }) });
        }), g = (t3, n2) => d(void 0, void 0, void 0, function* () {
          var r2, i3;
          const o3 = l(t3), a2 = yield null === (r2 = o3.data) || void 0 === r2 ? void 0 : r2.string();
          if (a2) {
            const t4 = new (e2()).XmlDocument(a2);
            return { mediaType: null === (i3 = f(t4).find((t5) => n2.endsWith(t5.href))) || void 0 === i3 ? void 0 : i3.mediaType };
          }
          return { mediaType: m(n2) };
        }), m = (t3) => t3.endsWith(".css") ? "text/css; charset=UTF-8" : t3.endsWith(".jpg") ? "image/jpg" : t3.endsWith(".xhtml") ? "application/xhtml+xml" : t3.endsWith(".mp4") ? "video/mp4" : t3.endsWith(".svg") ? "image/svg+xml" : void 0;
        const y = ({ archive: t3, baseUrl: n2 }) => (n3) => {
          return r2 = void 0, i3 = void 0, a2 = function* () {
            var r3;
            const i4 = t3.files.find((t4) => "comicinfo.xml" === t4.basename.toLowerCase());
            if (!i4)
              return n3;
            const o4 = yield i4.string(), a3 = (null === (r3 = new (e2()).XmlDocument(o4).childNamed("Manga")) || void 0 === r3 ? void 0 : r3.val) || "unknown";
            return Object.assign(Object.assign({}, n3), { spineItems: n3.spineItems.filter((t4) => "comicinfo.xml" !== t4.id.toLowerCase()), readingDirection: "YesAndRightToLeft" === a3 ? "rtl" : "ltr" });
          }, new ((o3 = void 0) || (o3 = Promise))(function(t4, e3) {
            function n4(t5) {
              try {
                u2(a2.next(t5));
              } catch (t6) {
                e3(t6);
              }
            }
            function s2(t5) {
              try {
                u2(a2.throw(t5));
              } catch (t6) {
                e3(t6);
              }
            }
            function u2(e4) {
              var r3;
              e4.done ? t4(e4.value) : (r3 = e4.value, r3 instanceof o3 ? r3 : new o3(function(t5) {
                t5(r3);
              })).then(n4, s2);
            }
            u2((a2 = a2.apply(r2, i3 || [])).next());
          });
          var r2, i3, o3, a2;
        };
        const v = ({ archive: t3, baseUrl: e3 }) => (n2) => {
          return r2 = void 0, i3 = void 0, a2 = function* () {
            var n3;
            const r3 = Object.values(t3.files).filter((t4) => !t4.dir);
            return { filename: t3.filename, nav: { toc: [] }, title: (null === (n3 = t3.files.find(({ dir: t4 }) => t4)) || void 0 === n3 ? void 0 : n3.basename.replace(/\/$/, "")) || "", renditionLayout: "pre-paginated", renditionSpread: "auto", readingDirection: "ltr", spineItems: r3.map((t4) => ({ id: t4.basename, path: `${t4.uri}`, href: e3 ? `${e3}/${t4.uri}` : t4.uri, renditionLayout: "pre-paginated", progressionWeight: 1 / r3.length, pageSpreadLeft: void 0, pageSpreadRight: void 0, mediaType: t4.encodingFormat })), items: r3.map((t4) => ({ id: t4.basename, href: e3 ? `${e3}/${t4.uri}` : t4.uri })) };
          }, new ((o3 = void 0) || (o3 = Promise))(function(t4, e4) {
            function n3(t5) {
              try {
                u2(a2.next(t5));
              } catch (t6) {
                e4(t6);
              }
            }
            function s2(t5) {
              try {
                u2(a2.throw(t5));
              } catch (t6) {
                e4(t6);
              }
            }
            function u2(e5) {
              var r3;
              e5.done ? t4(e5.value) : (r3 = e5.value, r3 instanceof o3 ? r3 : new o3(function(t5) {
                t5(r3);
              })).then(n3, s2);
            }
            u2((a2 = a2.apply(r2, i3 || [])).next());
          });
          var r2, i3, o3, a2;
        };
        var b = function(t3, e3, n2, r2) {
          return new (n2 || (n2 = Promise))(function(i3, o3) {
            function a2(t4) {
              try {
                u2(r2.next(t4));
              } catch (t5) {
                o3(t5);
              }
            }
            function s2(t4) {
              try {
                u2(r2.throw(t4));
              } catch (t5) {
                o3(t5);
              }
            }
            function u2(t4) {
              var e4;
              t4.done ? i3(t4.value) : (e4 = t4.value, e4 instanceof n2 ? e4 : new n2(function(t5) {
                t5(e4);
              })).then(a2, s2);
            }
            u2((r2 = r2.apply(t3, e3 || [])).next());
          });
        };
        const T = { filename: "", items: [], nav: { toc: [] }, readingDirection: "ltr", renditionLayout: "pre-paginated", renditionSpread: "auto", spineItems: [], title: "" }, E = (t3, { baseUrl: e3 = "" } = {}) => b(void 0, void 0, void 0, function* () {
          const n2 = [v({ archive: t3, baseUrl: e3 }), h({ archive: t3, baseUrl: e3 }), y({ archive: t3, baseUrl: e3 })];
          try {
            const t4 = yield n2.reduce((t5, e5) => b(void 0, void 0, void 0, function* () {
              return yield e5(yield t5);
            }), Promise.resolve(T)), e4 = JSON.stringify(t4);
            return new Response(e4, { status: 200 });
          } catch (t4) {
            return c.error(t4), new Response(null == t4 ? void 0 : t4.message, { status: 500 });
          }
        }), w = (t3) => {
          var e3, n2;
          switch ((null === (n2 = null === (e3 = t3.split(/[#?]/)[0]) || void 0 === e3 ? void 0 : e3.split(".").pop()) || void 0 === n2 ? void 0 : n2.trim()) || "") {
            case "png":
              return "image/png";
            case "jpg":
              return "image/jpg";
            case "jpeg":
              return "image/jpeg";
            case "txt":
              return "text/plain";
            case "webp":
              return "image/webp";
          }
        }, N = (t3) => t3.substring(t3.lastIndexOf("/") + 1) || t3;
        var A = function(t3, e3, n2, r2) {
          return new (n2 || (n2 = Promise))(function(i3, o3) {
            function a2(t4) {
              try {
                u2(r2.next(t4));
              } catch (t5) {
                o3(t5);
              }
            }
            function s2(t4) {
              try {
                u2(r2.throw(t4));
              } catch (t5) {
                o3(t5);
              }
            }
            function u2(t4) {
              var e4;
              t4.done ? i3(t4.value) : (e4 = t4.value, e4 instanceof n2 ? e4 : new n2(function(t5) {
                t5(e4);
              })).then(a2, s2);
            }
            u2((r2 = r2.apply(t3, e3 || [])).next());
          });
        };
        const I = (t3, e3) => A(void 0, void 0, void 0, function* () {
          const n2 = `
    <?xml version="1.0" encoding="UTF-8"?><package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="bookid">
      <metadata>
        <meta property="rendition:layout">${(null == e3 ? void 0 : e3.useRenditionFlow) ? "reflowable" : "pre-paginated"}</meta>
        ${(null == e3 ? void 0 : e3.useRenditionFlow) ? '<meta property="rendition:flow">scrolled-continuous</meta>' : ""}
      </metadata>
      <manifest>
        ${t3.map((t4) => `<item id="${N(t4)}" href="${t4}" media-type="${w(t4)}"/>`).join("\n")}
      </manifest>
      <spine>
        ${t3.map((t4) => `<itemref idref="${N(t4)}" />`).join("\n")}
      </spine>
    </package>
  `;
          return { filename: "", files: [{ dir: false, basename: "content.opf", uri: "content.opf", size: 0, base64: () => A(void 0, void 0, void 0, function* () {
            return n2;
          }), blob: () => A(void 0, void 0, void 0, function* () {
            return new Blob();
          }), string: () => A(void 0, void 0, void 0, function* () {
            return n2;
          }) }, ...t3.map((e4) => ({ dir: false, basename: N(e4), encodingFormat: w(e4), uri: e4, size: 100 / t3.length, base64: () => A(void 0, void 0, void 0, function* () {
            return "";
          }), blob: () => A(void 0, void 0, void 0, function* () {
            return new Blob();
          }), string: () => A(void 0, void 0, void 0, function* () {
            return "";
          }) }))] };
        });
        var _2 = function(t3, e3, n2, r2) {
          return new (n2 || (n2 = Promise))(function(i3, o3) {
            function a2(t4) {
              try {
                u2(r2.next(t4));
              } catch (t5) {
                o3(t5);
              }
            }
            function s2(t4) {
              try {
                u2(r2.throw(t4));
              } catch (t5) {
                o3(t5);
              }
            }
            function u2(t4) {
              var e4;
              t4.done ? i3(t4.value) : (e4 = t4.value, e4 instanceof n2 ? e4 : new n2(function(t5) {
                t5(e4);
              })).then(a2, s2);
            }
            u2((r2 = r2.apply(t3, e3 || [])).next());
          });
        };
        const B = (t3, e3) => _2(void 0, void 0, void 0, function* () {
          const n2 = `
      <?xml version="1.0" encoding="UTF-8"?>
      <package xmlns="http://www.idpf.org/2007/opf" version="3.0" xml:lang="ja" prefix="rendition: http://www.idpf.org/vocab/rendition/#"
        unique-identifier="ootuya-id">
        <metadata xmlns:opf="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/"
              xmlns:dcterms="http://purl.org/dc/terms/">
              <meta property="rendition:layout">reflowable</meta>
        </metadata>
        <manifest>
            <item id="p01" href="p01.txt" media-type="text/plain"/>
        </manifest>
        <spine page-progression-direction="${(null == e3 ? void 0 : e3.direction) || "ltr"}">
          <itemref idref="p01" />
        </spine>
      </package>
    `;
          return { filename: "content.txt", files: [{ dir: false, basename: N("generated.opf"), uri: "generated.opf", blob: () => _2(void 0, void 0, void 0, function* () {
            return new Blob([n2]);
          }), string: () => _2(void 0, void 0, void 0, function* () {
            return n2;
          }), base64: () => _2(void 0, void 0, void 0, function* () {
            return btoa(n2);
          }), size: 0 }, { dir: false, basename: N("p01.txt"), uri: "p01.txt", blob: () => _2(void 0, void 0, void 0, function* () {
            return "string" == typeof t3 ? new Blob([t3]) : t3;
          }), string: () => _2(void 0, void 0, void 0, function* () {
            return "string" == typeof t3 ? t3 : t3.text();
          }), base64: () => _2(void 0, void 0, void 0, function* () {
            return "string" == typeof t3 ? btoa(t3) : (o3 = t3, e4 = void 0, n3 = void 0, i3 = function* () {
              return new Promise((t4) => {
                const e5 = new FileReader();
                e5.readAsDataURL(o3), e5.onloadend = function() {
                  const n4 = e5.result;
                  t4(n4);
                };
              });
            }, new ((r2 = void 0) || (r2 = Promise))(function(t4, o4) {
              function a2(t5) {
                try {
                  u2(i3.next(t5));
                } catch (t6) {
                  o4(t6);
                }
              }
              function s2(t5) {
                try {
                  u2(i3.throw(t5));
                } catch (t6) {
                  o4(t6);
                }
              }
              function u2(e5) {
                var n4;
                e5.done ? t4(e5.value) : (n4 = e5.value, n4 instanceof r2 ? n4 : new r2(function(t5) {
                  t5(n4);
                })).then(a2, s2);
              }
              u2((i3 = i3.apply(e4, n3 || [])).next());
            }));
            var e4, n3, r2, i3, o3;
          }), size: "string" == typeof t3 ? t3.length : t3.size, encodingFormat: "text/plain" }] };
        }), C = (t3, e3) => {
          var n2;
          const r2 = t3.split(/(\d+)/), i3 = e3.split(/(\d+)/);
          for (let t4 = 0, e4 = r2.length; t4 < e4; t4++)
            if (r2[t4] !== i3[t4])
              return (null === (n2 = r2[t4]) || void 0 === n2 ? void 0 : n2.match(/\d/)) ? +(r2[t4] || "") - +(i3[t4] || "") : (r2[t4] || "").localeCompare(i3[t4] || "");
          return 1;
        };
        const O = (t3, { orderByAlpha: e3, name: n2 } = {}) => {
          return r2 = void 0, i3 = void 0, a2 = function* () {
            let r3 = Object.values(t3.files);
            return e3 && (r3 = r3.sort((t4, e4) => C(t4.name, e4.name))), { filename: n2 || "", files: r3.map((t4) => Object.assign(Object.assign({ dir: t4.dir, basename: N(t4.name), uri: t4.name, blob: () => t4.async("blob"), string: () => t4.async("string"), base64: () => t4.async("base64") }, t4.internalStream && { stream: t4.internalStream }), { size: t4._data.uncompressedSize })) };
          }, new ((o3 = void 0) || (o3 = Promise))(function(t4, e4) {
            function n3(t5) {
              try {
                u2(a2.next(t5));
              } catch (t6) {
                e4(t6);
              }
            }
            function s2(t5) {
              try {
                u2(a2.throw(t5));
              } catch (t6) {
                e4(t6);
              }
            }
            function u2(e5) {
              var r3;
              e5.done ? t4(e5.value) : (r3 = e5.value, r3 instanceof o3 ? r3 : new o3(function(t5) {
                t5(r3);
              })).then(n3, s2);
            }
            u2((a2 = a2.apply(r2, i3 || [])).next());
          });
          var r2, i3, o3, a2;
        };
        var x = function(t3, e3, n2, r2) {
          return new (n2 || (n2 = Promise))(function(i3, o3) {
            function a2(t4) {
              try {
                u2(r2.next(t4));
              } catch (t5) {
                o3(t5);
              }
            }
            function s2(t4) {
              try {
                u2(r2.throw(t4));
              } catch (t5) {
                o3(t5);
              }
            }
            function u2(t4) {
              var e4;
              t4.done ? i3(t4.value) : (e4 = t4.value, e4 instanceof n2 ? e4 : new n2(function(t5) {
                t5(e4);
              })).then(a2, s2);
            }
            u2((r2 = r2.apply(t3, e3 || [])).next());
          });
        };
        const S = (t3, { orderByAlpha: e3, name: n2 } = {}) => x(void 0, void 0, void 0, function* () {
          let r2 = t3;
          return e3 && (r2 = r2.sort((t4, e4) => C(t4.name, e4.name))), { filename: n2 || "", files: r2.map((t4) => ({ dir: t4.isDir, basename: N(t4.name), uri: t4.name, blob: () => x(void 0, void 0, void 0, function* () {
            return new Blob([yield t4.data()]);
          }), string: () => x(void 0, void 0, void 0, function* () {
            const e4 = yield t4.data();
            return String.fromCharCode.apply(null, Array.from(new Uint16Array(e4)));
          }), base64: () => x(void 0, void 0, void 0, function* () {
            return "";
          }), size: t4.size })) };
        });
      })();
      var i = exports;
      for (var o in r)
        i[o] = r[o];
      r.__esModule && Object.defineProperty(i, "__esModule", { value: true });
    })();
  })(dist);
  function commonjsRequire(path) {
    throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
  }
  var localforageExports = {};
  var localforage$1 = {
    get exports() {
      return localforageExports;
    },
    set exports(v) {
      localforageExports = v;
    }
  };
  /*!
      localForage -- Offline Storage, Improved
      Version 1.10.0
      https://localforage.github.io/localForage
      (c) 2013-2017 Mozilla, Apache License 2.0
  */
  (function(module2, exports) {
    (function(f) {
      {
        module2.exports = f();
      }
    })(function() {
      return function e(t, n, r) {
        function s(o2, u) {
          if (!n[o2]) {
            if (!t[o2]) {
              var a = typeof commonjsRequire == "function" && commonjsRequire;
              if (!u && a)
                return a(o2, true);
              if (i)
                return i(o2, true);
              var f = new Error("Cannot find module '" + o2 + "'");
              throw f.code = "MODULE_NOT_FOUND", f;
            }
            var l = n[o2] = { exports: {} };
            t[o2][0].call(l.exports, function(e2) {
              var n2 = t[o2][1][e2];
              return s(n2 ? n2 : e2);
            }, l, l.exports, e, t, n, r);
          }
          return n[o2].exports;
        }
        var i = typeof commonjsRequire == "function" && commonjsRequire;
        for (var o = 0; o < r.length; o++)
          s(r[o]);
        return s;
      }({ 1: [function(_dereq_, module3, exports2) {
        (function(global2) {
          var Mutation = global2.MutationObserver || global2.WebKitMutationObserver;
          var scheduleDrain;
          {
            if (Mutation) {
              var called = 0;
              var observer = new Mutation(nextTick);
              var element = global2.document.createTextNode("");
              observer.observe(element, {
                characterData: true
              });
              scheduleDrain = function() {
                element.data = called = ++called % 2;
              };
            } else if (!global2.setImmediate && typeof global2.MessageChannel !== "undefined") {
              var channel = new global2.MessageChannel();
              channel.port1.onmessage = nextTick;
              scheduleDrain = function() {
                channel.port2.postMessage(0);
              };
            } else if ("document" in global2 && "onreadystatechange" in global2.document.createElement("script")) {
              scheduleDrain = function() {
                var scriptEl = global2.document.createElement("script");
                scriptEl.onreadystatechange = function() {
                  nextTick();
                  scriptEl.onreadystatechange = null;
                  scriptEl.parentNode.removeChild(scriptEl);
                  scriptEl = null;
                };
                global2.document.documentElement.appendChild(scriptEl);
              };
            } else {
              scheduleDrain = function() {
                setTimeout(nextTick, 0);
              };
            }
          }
          var draining;
          var queue = [];
          function nextTick() {
            draining = true;
            var i, oldQueue;
            var len = queue.length;
            while (len) {
              oldQueue = queue;
              queue = [];
              i = -1;
              while (++i < len) {
                oldQueue[i]();
              }
              len = queue.length;
            }
            draining = false;
          }
          module3.exports = immediate;
          function immediate(task) {
            if (queue.push(task) === 1 && !draining) {
              scheduleDrain();
            }
          }
        }).call(this, typeof commonjsGlobal !== "undefined" ? commonjsGlobal : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
      }, {}], 2: [function(_dereq_, module3, exports2) {
        var immediate = _dereq_(1);
        function INTERNAL() {
        }
        var handlers = {};
        var REJECTED = ["REJECTED"];
        var FULFILLED = ["FULFILLED"];
        var PENDING = ["PENDING"];
        module3.exports = Promise2;
        function Promise2(resolver) {
          if (typeof resolver !== "function") {
            throw new TypeError("resolver must be a function");
          }
          this.state = PENDING;
          this.queue = [];
          this.outcome = void 0;
          if (resolver !== INTERNAL) {
            safelyResolveThenable(this, resolver);
          }
        }
        Promise2.prototype["catch"] = function(onRejected) {
          return this.then(null, onRejected);
        };
        Promise2.prototype.then = function(onFulfilled, onRejected) {
          if (typeof onFulfilled !== "function" && this.state === FULFILLED || typeof onRejected !== "function" && this.state === REJECTED) {
            return this;
          }
          var promise = new this.constructor(INTERNAL);
          if (this.state !== PENDING) {
            var resolver = this.state === FULFILLED ? onFulfilled : onRejected;
            unwrap2(promise, resolver, this.outcome);
          } else {
            this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
          }
          return promise;
        };
        function QueueItem(promise, onFulfilled, onRejected) {
          this.promise = promise;
          if (typeof onFulfilled === "function") {
            this.onFulfilled = onFulfilled;
            this.callFulfilled = this.otherCallFulfilled;
          }
          if (typeof onRejected === "function") {
            this.onRejected = onRejected;
            this.callRejected = this.otherCallRejected;
          }
        }
        QueueItem.prototype.callFulfilled = function(value) {
          handlers.resolve(this.promise, value);
        };
        QueueItem.prototype.otherCallFulfilled = function(value) {
          unwrap2(this.promise, this.onFulfilled, value);
        };
        QueueItem.prototype.callRejected = function(value) {
          handlers.reject(this.promise, value);
        };
        QueueItem.prototype.otherCallRejected = function(value) {
          unwrap2(this.promise, this.onRejected, value);
        };
        function unwrap2(promise, func, value) {
          immediate(function() {
            var returnValue;
            try {
              returnValue = func(value);
            } catch (e) {
              return handlers.reject(promise, e);
            }
            if (returnValue === promise) {
              handlers.reject(promise, new TypeError("Cannot resolve promise with itself"));
            } else {
              handlers.resolve(promise, returnValue);
            }
          });
        }
        handlers.resolve = function(self2, value) {
          var result = tryCatch(getThen, value);
          if (result.status === "error") {
            return handlers.reject(self2, result.value);
          }
          var thenable = result.value;
          if (thenable) {
            safelyResolveThenable(self2, thenable);
          } else {
            self2.state = FULFILLED;
            self2.outcome = value;
            var i = -1;
            var len = self2.queue.length;
            while (++i < len) {
              self2.queue[i].callFulfilled(value);
            }
          }
          return self2;
        };
        handlers.reject = function(self2, error) {
          self2.state = REJECTED;
          self2.outcome = error;
          var i = -1;
          var len = self2.queue.length;
          while (++i < len) {
            self2.queue[i].callRejected(error);
          }
          return self2;
        };
        function getThen(obj) {
          var then = obj && obj.then;
          if (obj && (typeof obj === "object" || typeof obj === "function") && typeof then === "function") {
            return function appyThen() {
              then.apply(obj, arguments);
            };
          }
        }
        function safelyResolveThenable(self2, thenable) {
          var called = false;
          function onError(value) {
            if (called) {
              return;
            }
            called = true;
            handlers.reject(self2, value);
          }
          function onSuccess(value) {
            if (called) {
              return;
            }
            called = true;
            handlers.resolve(self2, value);
          }
          function tryToUnwrap() {
            thenable(onSuccess, onError);
          }
          var result = tryCatch(tryToUnwrap);
          if (result.status === "error") {
            onError(result.value);
          }
        }
        function tryCatch(func, value) {
          var out = {};
          try {
            out.value = func(value);
            out.status = "success";
          } catch (e) {
            out.status = "error";
            out.value = e;
          }
          return out;
        }
        Promise2.resolve = resolve;
        function resolve(value) {
          if (value instanceof this) {
            return value;
          }
          return handlers.resolve(new this(INTERNAL), value);
        }
        Promise2.reject = reject;
        function reject(reason) {
          var promise = new this(INTERNAL);
          return handlers.reject(promise, reason);
        }
        Promise2.all = all;
        function all(iterable) {
          var self2 = this;
          if (Object.prototype.toString.call(iterable) !== "[object Array]") {
            return this.reject(new TypeError("must be an array"));
          }
          var len = iterable.length;
          var called = false;
          if (!len) {
            return this.resolve([]);
          }
          var values = new Array(len);
          var resolved = 0;
          var i = -1;
          var promise = new this(INTERNAL);
          while (++i < len) {
            allResolver(iterable[i], i);
          }
          return promise;
          function allResolver(value, i2) {
            self2.resolve(value).then(resolveFromAll, function(error) {
              if (!called) {
                called = true;
                handlers.reject(promise, error);
              }
            });
            function resolveFromAll(outValue) {
              values[i2] = outValue;
              if (++resolved === len && !called) {
                called = true;
                handlers.resolve(promise, values);
              }
            }
          }
        }
        Promise2.race = race;
        function race(iterable) {
          var self2 = this;
          if (Object.prototype.toString.call(iterable) !== "[object Array]") {
            return this.reject(new TypeError("must be an array"));
          }
          var len = iterable.length;
          var called = false;
          if (!len) {
            return this.resolve([]);
          }
          var i = -1;
          var promise = new this(INTERNAL);
          while (++i < len) {
            resolver(iterable[i]);
          }
          return promise;
          function resolver(value) {
            self2.resolve(value).then(function(response) {
              if (!called) {
                called = true;
                handlers.resolve(promise, response);
              }
            }, function(error) {
              if (!called) {
                called = true;
                handlers.reject(promise, error);
              }
            });
          }
        }
      }, { "1": 1 }], 3: [function(_dereq_, module3, exports2) {
        (function(global2) {
          if (typeof global2.Promise !== "function") {
            global2.Promise = _dereq_(2);
          }
        }).call(this, typeof commonjsGlobal !== "undefined" ? commonjsGlobal : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
      }, { "2": 2 }], 4: [function(_dereq_, module3, exports2) {
        var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
          return typeof obj;
        } : function(obj) {
          return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
        };
        function _classCallCheck(instance, Constructor) {
          if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
          }
        }
        function getIDB() {
          try {
            if (typeof indexedDB !== "undefined") {
              return indexedDB;
            }
            if (typeof webkitIndexedDB !== "undefined") {
              return webkitIndexedDB;
            }
            if (typeof mozIndexedDB !== "undefined") {
              return mozIndexedDB;
            }
            if (typeof OIndexedDB !== "undefined") {
              return OIndexedDB;
            }
            if (typeof msIndexedDB !== "undefined") {
              return msIndexedDB;
            }
          } catch (e) {
            return;
          }
        }
        var idb = getIDB();
        function isIndexedDBValid() {
          try {
            if (!idb || !idb.open) {
              return false;
            }
            var isSafari = typeof openDatabase !== "undefined" && /(Safari|iPhone|iPad|iPod)/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent) && !/BlackBerry/.test(navigator.platform);
            var hasFetch = typeof fetch === "function" && fetch.toString().indexOf("[native code") !== -1;
            return (!isSafari || hasFetch) && typeof indexedDB !== "undefined" && typeof IDBKeyRange !== "undefined";
          } catch (e) {
            return false;
          }
        }
        function createBlob(parts, properties) {
          parts = parts || [];
          properties = properties || {};
          try {
            return new Blob(parts, properties);
          } catch (e) {
            if (e.name !== "TypeError") {
              throw e;
            }
            var Builder = typeof BlobBuilder !== "undefined" ? BlobBuilder : typeof MSBlobBuilder !== "undefined" ? MSBlobBuilder : typeof MozBlobBuilder !== "undefined" ? MozBlobBuilder : WebKitBlobBuilder;
            var builder = new Builder();
            for (var i = 0; i < parts.length; i += 1) {
              builder.append(parts[i]);
            }
            return builder.getBlob(properties.type);
          }
        }
        if (typeof Promise === "undefined") {
          _dereq_(3);
        }
        var Promise$1 = Promise;
        function executeCallback(promise, callback) {
          if (callback) {
            promise.then(function(result) {
              callback(null, result);
            }, function(error) {
              callback(error);
            });
          }
        }
        function executeTwoCallbacks(promise, callback, errorCallback) {
          if (typeof callback === "function") {
            promise.then(callback);
          }
          if (typeof errorCallback === "function") {
            promise["catch"](errorCallback);
          }
        }
        function normalizeKey(key2) {
          if (typeof key2 !== "string") {
            console.warn(key2 + " used as a key, but it is not a string.");
            key2 = String(key2);
          }
          return key2;
        }
        function getCallback() {
          if (arguments.length && typeof arguments[arguments.length - 1] === "function") {
            return arguments[arguments.length - 1];
          }
        }
        var DETECT_BLOB_SUPPORT_STORE = "local-forage-detect-blob-support";
        var supportsBlobs = void 0;
        var dbContexts = {};
        var toString = Object.prototype.toString;
        var READ_ONLY = "readonly";
        var READ_WRITE = "readwrite";
        function _binStringToArrayBuffer(bin) {
          var length2 = bin.length;
          var buf = new ArrayBuffer(length2);
          var arr = new Uint8Array(buf);
          for (var i = 0; i < length2; i++) {
            arr[i] = bin.charCodeAt(i);
          }
          return buf;
        }
        function _checkBlobSupportWithoutCaching(idb2) {
          return new Promise$1(function(resolve) {
            var txn = idb2.transaction(DETECT_BLOB_SUPPORT_STORE, READ_WRITE);
            var blob = createBlob([""]);
            txn.objectStore(DETECT_BLOB_SUPPORT_STORE).put(blob, "key");
            txn.onabort = function(e) {
              e.preventDefault();
              e.stopPropagation();
              resolve(false);
            };
            txn.oncomplete = function() {
              var matchedChrome = navigator.userAgent.match(/Chrome\/(\d+)/);
              var matchedEdge = navigator.userAgent.match(/Edge\//);
              resolve(matchedEdge || !matchedChrome || parseInt(matchedChrome[1], 10) >= 43);
            };
          })["catch"](function() {
            return false;
          });
        }
        function _checkBlobSupport(idb2) {
          if (typeof supportsBlobs === "boolean") {
            return Promise$1.resolve(supportsBlobs);
          }
          return _checkBlobSupportWithoutCaching(idb2).then(function(value) {
            supportsBlobs = value;
            return supportsBlobs;
          });
        }
        function _deferReadiness(dbInfo) {
          var dbContext = dbContexts[dbInfo.name];
          var deferredOperation = {};
          deferredOperation.promise = new Promise$1(function(resolve, reject) {
            deferredOperation.resolve = resolve;
            deferredOperation.reject = reject;
          });
          dbContext.deferredOperations.push(deferredOperation);
          if (!dbContext.dbReady) {
            dbContext.dbReady = deferredOperation.promise;
          } else {
            dbContext.dbReady = dbContext.dbReady.then(function() {
              return deferredOperation.promise;
            });
          }
        }
        function _advanceReadiness(dbInfo) {
          var dbContext = dbContexts[dbInfo.name];
          var deferredOperation = dbContext.deferredOperations.pop();
          if (deferredOperation) {
            deferredOperation.resolve();
            return deferredOperation.promise;
          }
        }
        function _rejectReadiness(dbInfo, err) {
          var dbContext = dbContexts[dbInfo.name];
          var deferredOperation = dbContext.deferredOperations.pop();
          if (deferredOperation) {
            deferredOperation.reject(err);
            return deferredOperation.promise;
          }
        }
        function _getConnection(dbInfo, upgradeNeeded) {
          return new Promise$1(function(resolve, reject) {
            dbContexts[dbInfo.name] = dbContexts[dbInfo.name] || createDbContext();
            if (dbInfo.db) {
              if (upgradeNeeded) {
                _deferReadiness(dbInfo);
                dbInfo.db.close();
              } else {
                return resolve(dbInfo.db);
              }
            }
            var dbArgs = [dbInfo.name];
            if (upgradeNeeded) {
              dbArgs.push(dbInfo.version);
            }
            var openreq = idb.open.apply(idb, dbArgs);
            if (upgradeNeeded) {
              openreq.onupgradeneeded = function(e) {
                var db = openreq.result;
                try {
                  db.createObjectStore(dbInfo.storeName);
                  if (e.oldVersion <= 1) {
                    db.createObjectStore(DETECT_BLOB_SUPPORT_STORE);
                  }
                } catch (ex) {
                  if (ex.name === "ConstraintError") {
                    console.warn('The database "' + dbInfo.name + '" has been upgraded from version ' + e.oldVersion + " to version " + e.newVersion + ', but the storage "' + dbInfo.storeName + '" already exists.');
                  } else {
                    throw ex;
                  }
                }
              };
            }
            openreq.onerror = function(e) {
              e.preventDefault();
              reject(openreq.error);
            };
            openreq.onsuccess = function() {
              var db = openreq.result;
              db.onversionchange = function(e) {
                e.target.close();
              };
              resolve(db);
              _advanceReadiness(dbInfo);
            };
          });
        }
        function _getOriginalConnection(dbInfo) {
          return _getConnection(dbInfo, false);
        }
        function _getUpgradedConnection(dbInfo) {
          return _getConnection(dbInfo, true);
        }
        function _isUpgradeNeeded(dbInfo, defaultVersion) {
          if (!dbInfo.db) {
            return true;
          }
          var isNewStore = !dbInfo.db.objectStoreNames.contains(dbInfo.storeName);
          var isDowngrade = dbInfo.version < dbInfo.db.version;
          var isUpgrade = dbInfo.version > dbInfo.db.version;
          if (isDowngrade) {
            if (dbInfo.version !== defaultVersion) {
              console.warn('The database "' + dbInfo.name + `" can't be downgraded from version ` + dbInfo.db.version + " to version " + dbInfo.version + ".");
            }
            dbInfo.version = dbInfo.db.version;
          }
          if (isUpgrade || isNewStore) {
            if (isNewStore) {
              var incVersion = dbInfo.db.version + 1;
              if (incVersion > dbInfo.version) {
                dbInfo.version = incVersion;
              }
            }
            return true;
          }
          return false;
        }
        function _encodeBlob(blob) {
          return new Promise$1(function(resolve, reject) {
            var reader = new FileReader();
            reader.onerror = reject;
            reader.onloadend = function(e) {
              var base64 = btoa(e.target.result || "");
              resolve({
                __local_forage_encoded_blob: true,
                data: base64,
                type: blob.type
              });
            };
            reader.readAsBinaryString(blob);
          });
        }
        function _decodeBlob(encodedBlob) {
          var arrayBuff = _binStringToArrayBuffer(atob(encodedBlob.data));
          return createBlob([arrayBuff], { type: encodedBlob.type });
        }
        function _isEncodedBlob(value) {
          return value && value.__local_forage_encoded_blob;
        }
        function _fullyReady(callback) {
          var self2 = this;
          var promise = self2._initReady().then(function() {
            var dbContext = dbContexts[self2._dbInfo.name];
            if (dbContext && dbContext.dbReady) {
              return dbContext.dbReady;
            }
          });
          executeTwoCallbacks(promise, callback, callback);
          return promise;
        }
        function _tryReconnect(dbInfo) {
          _deferReadiness(dbInfo);
          var dbContext = dbContexts[dbInfo.name];
          var forages = dbContext.forages;
          for (var i = 0; i < forages.length; i++) {
            var forage = forages[i];
            if (forage._dbInfo.db) {
              forage._dbInfo.db.close();
              forage._dbInfo.db = null;
            }
          }
          dbInfo.db = null;
          return _getOriginalConnection(dbInfo).then(function(db) {
            dbInfo.db = db;
            if (_isUpgradeNeeded(dbInfo)) {
              return _getUpgradedConnection(dbInfo);
            }
            return db;
          }).then(function(db) {
            dbInfo.db = dbContext.db = db;
            for (var i2 = 0; i2 < forages.length; i2++) {
              forages[i2]._dbInfo.db = db;
            }
          })["catch"](function(err) {
            _rejectReadiness(dbInfo, err);
            throw err;
          });
        }
        function createTransaction(dbInfo, mode, callback, retries) {
          if (retries === void 0) {
            retries = 1;
          }
          try {
            var tx = dbInfo.db.transaction(dbInfo.storeName, mode);
            callback(null, tx);
          } catch (err) {
            if (retries > 0 && (!dbInfo.db || err.name === "InvalidStateError" || err.name === "NotFoundError")) {
              return Promise$1.resolve().then(function() {
                if (!dbInfo.db || err.name === "NotFoundError" && !dbInfo.db.objectStoreNames.contains(dbInfo.storeName) && dbInfo.version <= dbInfo.db.version) {
                  if (dbInfo.db) {
                    dbInfo.version = dbInfo.db.version + 1;
                  }
                  return _getUpgradedConnection(dbInfo);
                }
              }).then(function() {
                return _tryReconnect(dbInfo).then(function() {
                  createTransaction(dbInfo, mode, callback, retries - 1);
                });
              })["catch"](callback);
            }
            callback(err);
          }
        }
        function createDbContext() {
          return {
            forages: [],
            db: null,
            dbReady: null,
            deferredOperations: []
          };
        }
        function _initStorage(options) {
          var self2 = this;
          var dbInfo = {
            db: null
          };
          if (options) {
            for (var i in options) {
              dbInfo[i] = options[i];
            }
          }
          var dbContext = dbContexts[dbInfo.name];
          if (!dbContext) {
            dbContext = createDbContext();
            dbContexts[dbInfo.name] = dbContext;
          }
          dbContext.forages.push(self2);
          if (!self2._initReady) {
            self2._initReady = self2.ready;
            self2.ready = _fullyReady;
          }
          var initPromises = [];
          function ignoreErrors() {
            return Promise$1.resolve();
          }
          for (var j = 0; j < dbContext.forages.length; j++) {
            var forage = dbContext.forages[j];
            if (forage !== self2) {
              initPromises.push(forage._initReady()["catch"](ignoreErrors));
            }
          }
          var forages = dbContext.forages.slice(0);
          return Promise$1.all(initPromises).then(function() {
            dbInfo.db = dbContext.db;
            return _getOriginalConnection(dbInfo);
          }).then(function(db) {
            dbInfo.db = db;
            if (_isUpgradeNeeded(dbInfo, self2._defaultConfig.version)) {
              return _getUpgradedConnection(dbInfo);
            }
            return db;
          }).then(function(db) {
            dbInfo.db = dbContext.db = db;
            self2._dbInfo = dbInfo;
            for (var k = 0; k < forages.length; k++) {
              var forage2 = forages[k];
              if (forage2 !== self2) {
                forage2._dbInfo.db = dbInfo.db;
                forage2._dbInfo.version = dbInfo.version;
              }
            }
          });
        }
        function getItem(key2, callback) {
          var self2 = this;
          key2 = normalizeKey(key2);
          var promise = new Promise$1(function(resolve, reject) {
            self2.ready().then(function() {
              createTransaction(self2._dbInfo, READ_ONLY, function(err, transaction) {
                if (err) {
                  return reject(err);
                }
                try {
                  var store = transaction.objectStore(self2._dbInfo.storeName);
                  var req = store.get(key2);
                  req.onsuccess = function() {
                    var value = req.result;
                    if (value === void 0) {
                      value = null;
                    }
                    if (_isEncodedBlob(value)) {
                      value = _decodeBlob(value);
                    }
                    resolve(value);
                  };
                  req.onerror = function() {
                    reject(req.error);
                  };
                } catch (e) {
                  reject(e);
                }
              });
            })["catch"](reject);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function iterate(iterator, callback) {
          var self2 = this;
          var promise = new Promise$1(function(resolve, reject) {
            self2.ready().then(function() {
              createTransaction(self2._dbInfo, READ_ONLY, function(err, transaction) {
                if (err) {
                  return reject(err);
                }
                try {
                  var store = transaction.objectStore(self2._dbInfo.storeName);
                  var req = store.openCursor();
                  var iterationNumber = 1;
                  req.onsuccess = function() {
                    var cursor = req.result;
                    if (cursor) {
                      var value = cursor.value;
                      if (_isEncodedBlob(value)) {
                        value = _decodeBlob(value);
                      }
                      var result = iterator(value, cursor.key, iterationNumber++);
                      if (result !== void 0) {
                        resolve(result);
                      } else {
                        cursor["continue"]();
                      }
                    } else {
                      resolve();
                    }
                  };
                  req.onerror = function() {
                    reject(req.error);
                  };
                } catch (e) {
                  reject(e);
                }
              });
            })["catch"](reject);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function setItem(key2, value, callback) {
          var self2 = this;
          key2 = normalizeKey(key2);
          var promise = new Promise$1(function(resolve, reject) {
            var dbInfo;
            self2.ready().then(function() {
              dbInfo = self2._dbInfo;
              if (toString.call(value) === "[object Blob]") {
                return _checkBlobSupport(dbInfo.db).then(function(blobSupport) {
                  if (blobSupport) {
                    return value;
                  }
                  return _encodeBlob(value);
                });
              }
              return value;
            }).then(function(value2) {
              createTransaction(self2._dbInfo, READ_WRITE, function(err, transaction) {
                if (err) {
                  return reject(err);
                }
                try {
                  var store = transaction.objectStore(self2._dbInfo.storeName);
                  if (value2 === null) {
                    value2 = void 0;
                  }
                  var req = store.put(value2, key2);
                  transaction.oncomplete = function() {
                    if (value2 === void 0) {
                      value2 = null;
                    }
                    resolve(value2);
                  };
                  transaction.onabort = transaction.onerror = function() {
                    var err2 = req.error ? req.error : req.transaction.error;
                    reject(err2);
                  };
                } catch (e) {
                  reject(e);
                }
              });
            })["catch"](reject);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function removeItem(key2, callback) {
          var self2 = this;
          key2 = normalizeKey(key2);
          var promise = new Promise$1(function(resolve, reject) {
            self2.ready().then(function() {
              createTransaction(self2._dbInfo, READ_WRITE, function(err, transaction) {
                if (err) {
                  return reject(err);
                }
                try {
                  var store = transaction.objectStore(self2._dbInfo.storeName);
                  var req = store["delete"](key2);
                  transaction.oncomplete = function() {
                    resolve();
                  };
                  transaction.onerror = function() {
                    reject(req.error);
                  };
                  transaction.onabort = function() {
                    var err2 = req.error ? req.error : req.transaction.error;
                    reject(err2);
                  };
                } catch (e) {
                  reject(e);
                }
              });
            })["catch"](reject);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function clear(callback) {
          var self2 = this;
          var promise = new Promise$1(function(resolve, reject) {
            self2.ready().then(function() {
              createTransaction(self2._dbInfo, READ_WRITE, function(err, transaction) {
                if (err) {
                  return reject(err);
                }
                try {
                  var store = transaction.objectStore(self2._dbInfo.storeName);
                  var req = store.clear();
                  transaction.oncomplete = function() {
                    resolve();
                  };
                  transaction.onabort = transaction.onerror = function() {
                    var err2 = req.error ? req.error : req.transaction.error;
                    reject(err2);
                  };
                } catch (e) {
                  reject(e);
                }
              });
            })["catch"](reject);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function length(callback) {
          var self2 = this;
          var promise = new Promise$1(function(resolve, reject) {
            self2.ready().then(function() {
              createTransaction(self2._dbInfo, READ_ONLY, function(err, transaction) {
                if (err) {
                  return reject(err);
                }
                try {
                  var store = transaction.objectStore(self2._dbInfo.storeName);
                  var req = store.count();
                  req.onsuccess = function() {
                    resolve(req.result);
                  };
                  req.onerror = function() {
                    reject(req.error);
                  };
                } catch (e) {
                  reject(e);
                }
              });
            })["catch"](reject);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function key(n, callback) {
          var self2 = this;
          var promise = new Promise$1(function(resolve, reject) {
            if (n < 0) {
              resolve(null);
              return;
            }
            self2.ready().then(function() {
              createTransaction(self2._dbInfo, READ_ONLY, function(err, transaction) {
                if (err) {
                  return reject(err);
                }
                try {
                  var store = transaction.objectStore(self2._dbInfo.storeName);
                  var advanced = false;
                  var req = store.openKeyCursor();
                  req.onsuccess = function() {
                    var cursor = req.result;
                    if (!cursor) {
                      resolve(null);
                      return;
                    }
                    if (n === 0) {
                      resolve(cursor.key);
                    } else {
                      if (!advanced) {
                        advanced = true;
                        cursor.advance(n);
                      } else {
                        resolve(cursor.key);
                      }
                    }
                  };
                  req.onerror = function() {
                    reject(req.error);
                  };
                } catch (e) {
                  reject(e);
                }
              });
            })["catch"](reject);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function keys(callback) {
          var self2 = this;
          var promise = new Promise$1(function(resolve, reject) {
            self2.ready().then(function() {
              createTransaction(self2._dbInfo, READ_ONLY, function(err, transaction) {
                if (err) {
                  return reject(err);
                }
                try {
                  var store = transaction.objectStore(self2._dbInfo.storeName);
                  var req = store.openKeyCursor();
                  var keys2 = [];
                  req.onsuccess = function() {
                    var cursor = req.result;
                    if (!cursor) {
                      resolve(keys2);
                      return;
                    }
                    keys2.push(cursor.key);
                    cursor["continue"]();
                  };
                  req.onerror = function() {
                    reject(req.error);
                  };
                } catch (e) {
                  reject(e);
                }
              });
            })["catch"](reject);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function dropInstance(options, callback) {
          callback = getCallback.apply(this, arguments);
          var currentConfig = this.config();
          options = typeof options !== "function" && options || {};
          if (!options.name) {
            options.name = options.name || currentConfig.name;
            options.storeName = options.storeName || currentConfig.storeName;
          }
          var self2 = this;
          var promise;
          if (!options.name) {
            promise = Promise$1.reject("Invalid arguments");
          } else {
            var isCurrentDb = options.name === currentConfig.name && self2._dbInfo.db;
            var dbPromise = isCurrentDb ? Promise$1.resolve(self2._dbInfo.db) : _getOriginalConnection(options).then(function(db) {
              var dbContext = dbContexts[options.name];
              var forages = dbContext.forages;
              dbContext.db = db;
              for (var i = 0; i < forages.length; i++) {
                forages[i]._dbInfo.db = db;
              }
              return db;
            });
            if (!options.storeName) {
              promise = dbPromise.then(function(db) {
                _deferReadiness(options);
                var dbContext = dbContexts[options.name];
                var forages = dbContext.forages;
                db.close();
                for (var i = 0; i < forages.length; i++) {
                  var forage = forages[i];
                  forage._dbInfo.db = null;
                }
                var dropDBPromise = new Promise$1(function(resolve, reject) {
                  var req = idb.deleteDatabase(options.name);
                  req.onerror = function() {
                    var db2 = req.result;
                    if (db2) {
                      db2.close();
                    }
                    reject(req.error);
                  };
                  req.onblocked = function() {
                    console.warn('dropInstance blocked for database "' + options.name + '" until all open connections are closed');
                  };
                  req.onsuccess = function() {
                    var db2 = req.result;
                    if (db2) {
                      db2.close();
                    }
                    resolve(db2);
                  };
                });
                return dropDBPromise.then(function(db2) {
                  dbContext.db = db2;
                  for (var i2 = 0; i2 < forages.length; i2++) {
                    var _forage = forages[i2];
                    _advanceReadiness(_forage._dbInfo);
                  }
                })["catch"](function(err) {
                  (_rejectReadiness(options, err) || Promise$1.resolve())["catch"](function() {
                  });
                  throw err;
                });
              });
            } else {
              promise = dbPromise.then(function(db) {
                if (!db.objectStoreNames.contains(options.storeName)) {
                  return;
                }
                var newVersion = db.version + 1;
                _deferReadiness(options);
                var dbContext = dbContexts[options.name];
                var forages = dbContext.forages;
                db.close();
                for (var i = 0; i < forages.length; i++) {
                  var forage = forages[i];
                  forage._dbInfo.db = null;
                  forage._dbInfo.version = newVersion;
                }
                var dropObjectPromise = new Promise$1(function(resolve, reject) {
                  var req = idb.open(options.name, newVersion);
                  req.onerror = function(err) {
                    var db2 = req.result;
                    db2.close();
                    reject(err);
                  };
                  req.onupgradeneeded = function() {
                    var db2 = req.result;
                    db2.deleteObjectStore(options.storeName);
                  };
                  req.onsuccess = function() {
                    var db2 = req.result;
                    db2.close();
                    resolve(db2);
                  };
                });
                return dropObjectPromise.then(function(db2) {
                  dbContext.db = db2;
                  for (var j = 0; j < forages.length; j++) {
                    var _forage2 = forages[j];
                    _forage2._dbInfo.db = db2;
                    _advanceReadiness(_forage2._dbInfo);
                  }
                })["catch"](function(err) {
                  (_rejectReadiness(options, err) || Promise$1.resolve())["catch"](function() {
                  });
                  throw err;
                });
              });
            }
          }
          executeCallback(promise, callback);
          return promise;
        }
        var asyncStorage = {
          _driver: "asyncStorage",
          _initStorage,
          _support: isIndexedDBValid(),
          iterate,
          getItem,
          setItem,
          removeItem,
          clear,
          length,
          key,
          keys,
          dropInstance
        };
        function isWebSQLValid() {
          return typeof openDatabase === "function";
        }
        var BASE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        var BLOB_TYPE_PREFIX = "~~local_forage_type~";
        var BLOB_TYPE_PREFIX_REGEX = /^~~local_forage_type~([^~]+)~/;
        var SERIALIZED_MARKER = "__lfsc__:";
        var SERIALIZED_MARKER_LENGTH = SERIALIZED_MARKER.length;
        var TYPE_ARRAYBUFFER = "arbf";
        var TYPE_BLOB = "blob";
        var TYPE_INT8ARRAY = "si08";
        var TYPE_UINT8ARRAY = "ui08";
        var TYPE_UINT8CLAMPEDARRAY = "uic8";
        var TYPE_INT16ARRAY = "si16";
        var TYPE_INT32ARRAY = "si32";
        var TYPE_UINT16ARRAY = "ur16";
        var TYPE_UINT32ARRAY = "ui32";
        var TYPE_FLOAT32ARRAY = "fl32";
        var TYPE_FLOAT64ARRAY = "fl64";
        var TYPE_SERIALIZED_MARKER_LENGTH = SERIALIZED_MARKER_LENGTH + TYPE_ARRAYBUFFER.length;
        var toString$1 = Object.prototype.toString;
        function stringToBuffer(serializedString) {
          var bufferLength = serializedString.length * 0.75;
          var len = serializedString.length;
          var i;
          var p = 0;
          var encoded1, encoded2, encoded3, encoded4;
          if (serializedString[serializedString.length - 1] === "=") {
            bufferLength--;
            if (serializedString[serializedString.length - 2] === "=") {
              bufferLength--;
            }
          }
          var buffer = new ArrayBuffer(bufferLength);
          var bytes = new Uint8Array(buffer);
          for (i = 0; i < len; i += 4) {
            encoded1 = BASE_CHARS.indexOf(serializedString[i]);
            encoded2 = BASE_CHARS.indexOf(serializedString[i + 1]);
            encoded3 = BASE_CHARS.indexOf(serializedString[i + 2]);
            encoded4 = BASE_CHARS.indexOf(serializedString[i + 3]);
            bytes[p++] = encoded1 << 2 | encoded2 >> 4;
            bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
            bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
          }
          return buffer;
        }
        function bufferToString(buffer) {
          var bytes = new Uint8Array(buffer);
          var base64String = "";
          var i;
          for (i = 0; i < bytes.length; i += 3) {
            base64String += BASE_CHARS[bytes[i] >> 2];
            base64String += BASE_CHARS[(bytes[i] & 3) << 4 | bytes[i + 1] >> 4];
            base64String += BASE_CHARS[(bytes[i + 1] & 15) << 2 | bytes[i + 2] >> 6];
            base64String += BASE_CHARS[bytes[i + 2] & 63];
          }
          if (bytes.length % 3 === 2) {
            base64String = base64String.substring(0, base64String.length - 1) + "=";
          } else if (bytes.length % 3 === 1) {
            base64String = base64String.substring(0, base64String.length - 2) + "==";
          }
          return base64String;
        }
        function serialize(value, callback) {
          var valueType = "";
          if (value) {
            valueType = toString$1.call(value);
          }
          if (value && (valueType === "[object ArrayBuffer]" || value.buffer && toString$1.call(value.buffer) === "[object ArrayBuffer]")) {
            var buffer;
            var marker = SERIALIZED_MARKER;
            if (value instanceof ArrayBuffer) {
              buffer = value;
              marker += TYPE_ARRAYBUFFER;
            } else {
              buffer = value.buffer;
              if (valueType === "[object Int8Array]") {
                marker += TYPE_INT8ARRAY;
              } else if (valueType === "[object Uint8Array]") {
                marker += TYPE_UINT8ARRAY;
              } else if (valueType === "[object Uint8ClampedArray]") {
                marker += TYPE_UINT8CLAMPEDARRAY;
              } else if (valueType === "[object Int16Array]") {
                marker += TYPE_INT16ARRAY;
              } else if (valueType === "[object Uint16Array]") {
                marker += TYPE_UINT16ARRAY;
              } else if (valueType === "[object Int32Array]") {
                marker += TYPE_INT32ARRAY;
              } else if (valueType === "[object Uint32Array]") {
                marker += TYPE_UINT32ARRAY;
              } else if (valueType === "[object Float32Array]") {
                marker += TYPE_FLOAT32ARRAY;
              } else if (valueType === "[object Float64Array]") {
                marker += TYPE_FLOAT64ARRAY;
              } else {
                callback(new Error("Failed to get type for BinaryArray"));
              }
            }
            callback(marker + bufferToString(buffer));
          } else if (valueType === "[object Blob]") {
            var fileReader = new FileReader();
            fileReader.onload = function() {
              var str = BLOB_TYPE_PREFIX + value.type + "~" + bufferToString(this.result);
              callback(SERIALIZED_MARKER + TYPE_BLOB + str);
            };
            fileReader.readAsArrayBuffer(value);
          } else {
            try {
              callback(JSON.stringify(value));
            } catch (e) {
              console.error("Couldn't convert value into a JSON string: ", value);
              callback(null, e);
            }
          }
        }
        function deserialize(value) {
          if (value.substring(0, SERIALIZED_MARKER_LENGTH) !== SERIALIZED_MARKER) {
            return JSON.parse(value);
          }
          var serializedString = value.substring(TYPE_SERIALIZED_MARKER_LENGTH);
          var type = value.substring(SERIALIZED_MARKER_LENGTH, TYPE_SERIALIZED_MARKER_LENGTH);
          var blobType;
          if (type === TYPE_BLOB && BLOB_TYPE_PREFIX_REGEX.test(serializedString)) {
            var matcher = serializedString.match(BLOB_TYPE_PREFIX_REGEX);
            blobType = matcher[1];
            serializedString = serializedString.substring(matcher[0].length);
          }
          var buffer = stringToBuffer(serializedString);
          switch (type) {
            case TYPE_ARRAYBUFFER:
              return buffer;
            case TYPE_BLOB:
              return createBlob([buffer], { type: blobType });
            case TYPE_INT8ARRAY:
              return new Int8Array(buffer);
            case TYPE_UINT8ARRAY:
              return new Uint8Array(buffer);
            case TYPE_UINT8CLAMPEDARRAY:
              return new Uint8ClampedArray(buffer);
            case TYPE_INT16ARRAY:
              return new Int16Array(buffer);
            case TYPE_UINT16ARRAY:
              return new Uint16Array(buffer);
            case TYPE_INT32ARRAY:
              return new Int32Array(buffer);
            case TYPE_UINT32ARRAY:
              return new Uint32Array(buffer);
            case TYPE_FLOAT32ARRAY:
              return new Float32Array(buffer);
            case TYPE_FLOAT64ARRAY:
              return new Float64Array(buffer);
            default:
              throw new Error("Unkown type: " + type);
          }
        }
        var localforageSerializer = {
          serialize,
          deserialize,
          stringToBuffer,
          bufferToString
        };
        function createDbTable(t, dbInfo, callback, errorCallback) {
          t.executeSql("CREATE TABLE IF NOT EXISTS " + dbInfo.storeName + " (id INTEGER PRIMARY KEY, key unique, value)", [], callback, errorCallback);
        }
        function _initStorage$1(options) {
          var self2 = this;
          var dbInfo = {
            db: null
          };
          if (options) {
            for (var i in options) {
              dbInfo[i] = typeof options[i] !== "string" ? options[i].toString() : options[i];
            }
          }
          var dbInfoPromise = new Promise$1(function(resolve, reject) {
            try {
              dbInfo.db = openDatabase(dbInfo.name, String(dbInfo.version), dbInfo.description, dbInfo.size);
            } catch (e) {
              return reject(e);
            }
            dbInfo.db.transaction(function(t) {
              createDbTable(t, dbInfo, function() {
                self2._dbInfo = dbInfo;
                resolve();
              }, function(t2, error) {
                reject(error);
              });
            }, reject);
          });
          dbInfo.serializer = localforageSerializer;
          return dbInfoPromise;
        }
        function tryExecuteSql(t, dbInfo, sqlStatement, args, callback, errorCallback) {
          t.executeSql(sqlStatement, args, callback, function(t2, error) {
            if (error.code === error.SYNTAX_ERR) {
              t2.executeSql("SELECT name FROM sqlite_master WHERE type='table' AND name = ?", [dbInfo.storeName], function(t3, results) {
                if (!results.rows.length) {
                  createDbTable(t3, dbInfo, function() {
                    t3.executeSql(sqlStatement, args, callback, errorCallback);
                  }, errorCallback);
                } else {
                  errorCallback(t3, error);
                }
              }, errorCallback);
            } else {
              errorCallback(t2, error);
            }
          }, errorCallback);
        }
        function getItem$1(key2, callback) {
          var self2 = this;
          key2 = normalizeKey(key2);
          var promise = new Promise$1(function(resolve, reject) {
            self2.ready().then(function() {
              var dbInfo = self2._dbInfo;
              dbInfo.db.transaction(function(t) {
                tryExecuteSql(t, dbInfo, "SELECT * FROM " + dbInfo.storeName + " WHERE key = ? LIMIT 1", [key2], function(t2, results) {
                  var result = results.rows.length ? results.rows.item(0).value : null;
                  if (result) {
                    result = dbInfo.serializer.deserialize(result);
                  }
                  resolve(result);
                }, function(t2, error) {
                  reject(error);
                });
              });
            })["catch"](reject);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function iterate$1(iterator, callback) {
          var self2 = this;
          var promise = new Promise$1(function(resolve, reject) {
            self2.ready().then(function() {
              var dbInfo = self2._dbInfo;
              dbInfo.db.transaction(function(t) {
                tryExecuteSql(t, dbInfo, "SELECT * FROM " + dbInfo.storeName, [], function(t2, results) {
                  var rows = results.rows;
                  var length2 = rows.length;
                  for (var i = 0; i < length2; i++) {
                    var item = rows.item(i);
                    var result = item.value;
                    if (result) {
                      result = dbInfo.serializer.deserialize(result);
                    }
                    result = iterator(result, item.key, i + 1);
                    if (result !== void 0) {
                      resolve(result);
                      return;
                    }
                  }
                  resolve();
                }, function(t2, error) {
                  reject(error);
                });
              });
            })["catch"](reject);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function _setItem(key2, value, callback, retriesLeft) {
          var self2 = this;
          key2 = normalizeKey(key2);
          var promise = new Promise$1(function(resolve, reject) {
            self2.ready().then(function() {
              if (value === void 0) {
                value = null;
              }
              var originalValue = value;
              var dbInfo = self2._dbInfo;
              dbInfo.serializer.serialize(value, function(value2, error) {
                if (error) {
                  reject(error);
                } else {
                  dbInfo.db.transaction(function(t) {
                    tryExecuteSql(t, dbInfo, "INSERT OR REPLACE INTO " + dbInfo.storeName + " (key, value) VALUES (?, ?)", [key2, value2], function() {
                      resolve(originalValue);
                    }, function(t2, error2) {
                      reject(error2);
                    });
                  }, function(sqlError) {
                    if (sqlError.code === sqlError.QUOTA_ERR) {
                      if (retriesLeft > 0) {
                        resolve(_setItem.apply(self2, [key2, originalValue, callback, retriesLeft - 1]));
                        return;
                      }
                      reject(sqlError);
                    }
                  });
                }
              });
            })["catch"](reject);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function setItem$1(key2, value, callback) {
          return _setItem.apply(this, [key2, value, callback, 1]);
        }
        function removeItem$1(key2, callback) {
          var self2 = this;
          key2 = normalizeKey(key2);
          var promise = new Promise$1(function(resolve, reject) {
            self2.ready().then(function() {
              var dbInfo = self2._dbInfo;
              dbInfo.db.transaction(function(t) {
                tryExecuteSql(t, dbInfo, "DELETE FROM " + dbInfo.storeName + " WHERE key = ?", [key2], function() {
                  resolve();
                }, function(t2, error) {
                  reject(error);
                });
              });
            })["catch"](reject);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function clear$1(callback) {
          var self2 = this;
          var promise = new Promise$1(function(resolve, reject) {
            self2.ready().then(function() {
              var dbInfo = self2._dbInfo;
              dbInfo.db.transaction(function(t) {
                tryExecuteSql(t, dbInfo, "DELETE FROM " + dbInfo.storeName, [], function() {
                  resolve();
                }, function(t2, error) {
                  reject(error);
                });
              });
            })["catch"](reject);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function length$1(callback) {
          var self2 = this;
          var promise = new Promise$1(function(resolve, reject) {
            self2.ready().then(function() {
              var dbInfo = self2._dbInfo;
              dbInfo.db.transaction(function(t) {
                tryExecuteSql(t, dbInfo, "SELECT COUNT(key) as c FROM " + dbInfo.storeName, [], function(t2, results) {
                  var result = results.rows.item(0).c;
                  resolve(result);
                }, function(t2, error) {
                  reject(error);
                });
              });
            })["catch"](reject);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function key$1(n, callback) {
          var self2 = this;
          var promise = new Promise$1(function(resolve, reject) {
            self2.ready().then(function() {
              var dbInfo = self2._dbInfo;
              dbInfo.db.transaction(function(t) {
                tryExecuteSql(t, dbInfo, "SELECT key FROM " + dbInfo.storeName + " WHERE id = ? LIMIT 1", [n + 1], function(t2, results) {
                  var result = results.rows.length ? results.rows.item(0).key : null;
                  resolve(result);
                }, function(t2, error) {
                  reject(error);
                });
              });
            })["catch"](reject);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function keys$1(callback) {
          var self2 = this;
          var promise = new Promise$1(function(resolve, reject) {
            self2.ready().then(function() {
              var dbInfo = self2._dbInfo;
              dbInfo.db.transaction(function(t) {
                tryExecuteSql(t, dbInfo, "SELECT key FROM " + dbInfo.storeName, [], function(t2, results) {
                  var keys2 = [];
                  for (var i = 0; i < results.rows.length; i++) {
                    keys2.push(results.rows.item(i).key);
                  }
                  resolve(keys2);
                }, function(t2, error) {
                  reject(error);
                });
              });
            })["catch"](reject);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function getAllStoreNames(db) {
          return new Promise$1(function(resolve, reject) {
            db.transaction(function(t) {
              t.executeSql("SELECT name FROM sqlite_master WHERE type='table' AND name <> '__WebKitDatabaseInfoTable__'", [], function(t2, results) {
                var storeNames = [];
                for (var i = 0; i < results.rows.length; i++) {
                  storeNames.push(results.rows.item(i).name);
                }
                resolve({
                  db,
                  storeNames
                });
              }, function(t2, error) {
                reject(error);
              });
            }, function(sqlError) {
              reject(sqlError);
            });
          });
        }
        function dropInstance$1(options, callback) {
          callback = getCallback.apply(this, arguments);
          var currentConfig = this.config();
          options = typeof options !== "function" && options || {};
          if (!options.name) {
            options.name = options.name || currentConfig.name;
            options.storeName = options.storeName || currentConfig.storeName;
          }
          var self2 = this;
          var promise;
          if (!options.name) {
            promise = Promise$1.reject("Invalid arguments");
          } else {
            promise = new Promise$1(function(resolve) {
              var db;
              if (options.name === currentConfig.name) {
                db = self2._dbInfo.db;
              } else {
                db = openDatabase(options.name, "", "", 0);
              }
              if (!options.storeName) {
                resolve(getAllStoreNames(db));
              } else {
                resolve({
                  db,
                  storeNames: [options.storeName]
                });
              }
            }).then(function(operationInfo) {
              return new Promise$1(function(resolve, reject) {
                operationInfo.db.transaction(function(t) {
                  function dropTable(storeName) {
                    return new Promise$1(function(resolve2, reject2) {
                      t.executeSql("DROP TABLE IF EXISTS " + storeName, [], function() {
                        resolve2();
                      }, function(t2, error) {
                        reject2(error);
                      });
                    });
                  }
                  var operations = [];
                  for (var i = 0, len = operationInfo.storeNames.length; i < len; i++) {
                    operations.push(dropTable(operationInfo.storeNames[i]));
                  }
                  Promise$1.all(operations).then(function() {
                    resolve();
                  })["catch"](function(e) {
                    reject(e);
                  });
                }, function(sqlError) {
                  reject(sqlError);
                });
              });
            });
          }
          executeCallback(promise, callback);
          return promise;
        }
        var webSQLStorage = {
          _driver: "webSQLStorage",
          _initStorage: _initStorage$1,
          _support: isWebSQLValid(),
          iterate: iterate$1,
          getItem: getItem$1,
          setItem: setItem$1,
          removeItem: removeItem$1,
          clear: clear$1,
          length: length$1,
          key: key$1,
          keys: keys$1,
          dropInstance: dropInstance$1
        };
        function isLocalStorageValid() {
          try {
            return typeof localStorage !== "undefined" && "setItem" in localStorage && !!localStorage.setItem;
          } catch (e) {
            return false;
          }
        }
        function _getKeyPrefix(options, defaultConfig) {
          var keyPrefix = options.name + "/";
          if (options.storeName !== defaultConfig.storeName) {
            keyPrefix += options.storeName + "/";
          }
          return keyPrefix;
        }
        function checkIfLocalStorageThrows() {
          var localStorageTestKey = "_localforage_support_test";
          try {
            localStorage.setItem(localStorageTestKey, true);
            localStorage.removeItem(localStorageTestKey);
            return false;
          } catch (e) {
            return true;
          }
        }
        function _isLocalStorageUsable() {
          return !checkIfLocalStorageThrows() || localStorage.length > 0;
        }
        function _initStorage$2(options) {
          var self2 = this;
          var dbInfo = {};
          if (options) {
            for (var i in options) {
              dbInfo[i] = options[i];
            }
          }
          dbInfo.keyPrefix = _getKeyPrefix(options, self2._defaultConfig);
          if (!_isLocalStorageUsable()) {
            return Promise$1.reject();
          }
          self2._dbInfo = dbInfo;
          dbInfo.serializer = localforageSerializer;
          return Promise$1.resolve();
        }
        function clear$2(callback) {
          var self2 = this;
          var promise = self2.ready().then(function() {
            var keyPrefix = self2._dbInfo.keyPrefix;
            for (var i = localStorage.length - 1; i >= 0; i--) {
              var key2 = localStorage.key(i);
              if (key2.indexOf(keyPrefix) === 0) {
                localStorage.removeItem(key2);
              }
            }
          });
          executeCallback(promise, callback);
          return promise;
        }
        function getItem$2(key2, callback) {
          var self2 = this;
          key2 = normalizeKey(key2);
          var promise = self2.ready().then(function() {
            var dbInfo = self2._dbInfo;
            var result = localStorage.getItem(dbInfo.keyPrefix + key2);
            if (result) {
              result = dbInfo.serializer.deserialize(result);
            }
            return result;
          });
          executeCallback(promise, callback);
          return promise;
        }
        function iterate$2(iterator, callback) {
          var self2 = this;
          var promise = self2.ready().then(function() {
            var dbInfo = self2._dbInfo;
            var keyPrefix = dbInfo.keyPrefix;
            var keyPrefixLength = keyPrefix.length;
            var length2 = localStorage.length;
            var iterationNumber = 1;
            for (var i = 0; i < length2; i++) {
              var key2 = localStorage.key(i);
              if (key2.indexOf(keyPrefix) !== 0) {
                continue;
              }
              var value = localStorage.getItem(key2);
              if (value) {
                value = dbInfo.serializer.deserialize(value);
              }
              value = iterator(value, key2.substring(keyPrefixLength), iterationNumber++);
              if (value !== void 0) {
                return value;
              }
            }
          });
          executeCallback(promise, callback);
          return promise;
        }
        function key$2(n, callback) {
          var self2 = this;
          var promise = self2.ready().then(function() {
            var dbInfo = self2._dbInfo;
            var result;
            try {
              result = localStorage.key(n);
            } catch (error) {
              result = null;
            }
            if (result) {
              result = result.substring(dbInfo.keyPrefix.length);
            }
            return result;
          });
          executeCallback(promise, callback);
          return promise;
        }
        function keys$2(callback) {
          var self2 = this;
          var promise = self2.ready().then(function() {
            var dbInfo = self2._dbInfo;
            var length2 = localStorage.length;
            var keys2 = [];
            for (var i = 0; i < length2; i++) {
              var itemKey = localStorage.key(i);
              if (itemKey.indexOf(dbInfo.keyPrefix) === 0) {
                keys2.push(itemKey.substring(dbInfo.keyPrefix.length));
              }
            }
            return keys2;
          });
          executeCallback(promise, callback);
          return promise;
        }
        function length$2(callback) {
          var self2 = this;
          var promise = self2.keys().then(function(keys2) {
            return keys2.length;
          });
          executeCallback(promise, callback);
          return promise;
        }
        function removeItem$2(key2, callback) {
          var self2 = this;
          key2 = normalizeKey(key2);
          var promise = self2.ready().then(function() {
            var dbInfo = self2._dbInfo;
            localStorage.removeItem(dbInfo.keyPrefix + key2);
          });
          executeCallback(promise, callback);
          return promise;
        }
        function setItem$2(key2, value, callback) {
          var self2 = this;
          key2 = normalizeKey(key2);
          var promise = self2.ready().then(function() {
            if (value === void 0) {
              value = null;
            }
            var originalValue = value;
            return new Promise$1(function(resolve, reject) {
              var dbInfo = self2._dbInfo;
              dbInfo.serializer.serialize(value, function(value2, error) {
                if (error) {
                  reject(error);
                } else {
                  try {
                    localStorage.setItem(dbInfo.keyPrefix + key2, value2);
                    resolve(originalValue);
                  } catch (e) {
                    if (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED") {
                      reject(e);
                    }
                    reject(e);
                  }
                }
              });
            });
          });
          executeCallback(promise, callback);
          return promise;
        }
        function dropInstance$2(options, callback) {
          callback = getCallback.apply(this, arguments);
          options = typeof options !== "function" && options || {};
          if (!options.name) {
            var currentConfig = this.config();
            options.name = options.name || currentConfig.name;
            options.storeName = options.storeName || currentConfig.storeName;
          }
          var self2 = this;
          var promise;
          if (!options.name) {
            promise = Promise$1.reject("Invalid arguments");
          } else {
            promise = new Promise$1(function(resolve) {
              if (!options.storeName) {
                resolve(options.name + "/");
              } else {
                resolve(_getKeyPrefix(options, self2._defaultConfig));
              }
            }).then(function(keyPrefix) {
              for (var i = localStorage.length - 1; i >= 0; i--) {
                var key2 = localStorage.key(i);
                if (key2.indexOf(keyPrefix) === 0) {
                  localStorage.removeItem(key2);
                }
              }
            });
          }
          executeCallback(promise, callback);
          return promise;
        }
        var localStorageWrapper = {
          _driver: "localStorageWrapper",
          _initStorage: _initStorage$2,
          _support: isLocalStorageValid(),
          iterate: iterate$2,
          getItem: getItem$2,
          setItem: setItem$2,
          removeItem: removeItem$2,
          clear: clear$2,
          length: length$2,
          key: key$2,
          keys: keys$2,
          dropInstance: dropInstance$2
        };
        var sameValue = function sameValue2(x, y) {
          return x === y || typeof x === "number" && typeof y === "number" && isNaN(x) && isNaN(y);
        };
        var includes = function includes2(array, searchElement) {
          var len = array.length;
          var i = 0;
          while (i < len) {
            if (sameValue(array[i], searchElement)) {
              return true;
            }
            i++;
          }
          return false;
        };
        var isArray = Array.isArray || function(arg) {
          return Object.prototype.toString.call(arg) === "[object Array]";
        };
        var DefinedDrivers = {};
        var DriverSupport = {};
        var DefaultDrivers = {
          INDEXEDDB: asyncStorage,
          WEBSQL: webSQLStorage,
          LOCALSTORAGE: localStorageWrapper
        };
        var DefaultDriverOrder = [DefaultDrivers.INDEXEDDB._driver, DefaultDrivers.WEBSQL._driver, DefaultDrivers.LOCALSTORAGE._driver];
        var OptionalDriverMethods = ["dropInstance"];
        var LibraryMethods = ["clear", "getItem", "iterate", "key", "keys", "length", "removeItem", "setItem"].concat(OptionalDriverMethods);
        var DefaultConfig = {
          description: "",
          driver: DefaultDriverOrder.slice(),
          name: "localforage",
          size: 4980736,
          storeName: "keyvaluepairs",
          version: 1
        };
        function callWhenReady(localForageInstance, libraryMethod) {
          localForageInstance[libraryMethod] = function() {
            var _args = arguments;
            return localForageInstance.ready().then(function() {
              return localForageInstance[libraryMethod].apply(localForageInstance, _args);
            });
          };
        }
        function extend() {
          for (var i = 1; i < arguments.length; i++) {
            var arg = arguments[i];
            if (arg) {
              for (var _key in arg) {
                if (arg.hasOwnProperty(_key)) {
                  if (isArray(arg[_key])) {
                    arguments[0][_key] = arg[_key].slice();
                  } else {
                    arguments[0][_key] = arg[_key];
                  }
                }
              }
            }
          }
          return arguments[0];
        }
        var LocalForage = function() {
          function LocalForage2(options) {
            _classCallCheck(this, LocalForage2);
            for (var driverTypeKey in DefaultDrivers) {
              if (DefaultDrivers.hasOwnProperty(driverTypeKey)) {
                var driver = DefaultDrivers[driverTypeKey];
                var driverName = driver._driver;
                this[driverTypeKey] = driverName;
                if (!DefinedDrivers[driverName]) {
                  this.defineDriver(driver);
                }
              }
            }
            this._defaultConfig = extend({}, DefaultConfig);
            this._config = extend({}, this._defaultConfig, options);
            this._driverSet = null;
            this._initDriver = null;
            this._ready = false;
            this._dbInfo = null;
            this._wrapLibraryMethodsWithReady();
            this.setDriver(this._config.driver)["catch"](function() {
            });
          }
          LocalForage2.prototype.config = function config(options) {
            if ((typeof options === "undefined" ? "undefined" : _typeof(options)) === "object") {
              if (this._ready) {
                return new Error("Can't call config() after localforage has been used.");
              }
              for (var i in options) {
                if (i === "storeName") {
                  options[i] = options[i].replace(/\W/g, "_");
                }
                if (i === "version" && typeof options[i] !== "number") {
                  return new Error("Database version must be a number.");
                }
                this._config[i] = options[i];
              }
              if ("driver" in options && options.driver) {
                return this.setDriver(this._config.driver);
              }
              return true;
            } else if (typeof options === "string") {
              return this._config[options];
            } else {
              return this._config;
            }
          };
          LocalForage2.prototype.defineDriver = function defineDriver(driverObject, callback, errorCallback) {
            var promise = new Promise$1(function(resolve, reject) {
              try {
                var driverName = driverObject._driver;
                var complianceError = new Error("Custom driver not compliant; see https://mozilla.github.io/localForage/#definedriver");
                if (!driverObject._driver) {
                  reject(complianceError);
                  return;
                }
                var driverMethods = LibraryMethods.concat("_initStorage");
                for (var i = 0, len = driverMethods.length; i < len; i++) {
                  var driverMethodName = driverMethods[i];
                  var isRequired = !includes(OptionalDriverMethods, driverMethodName);
                  if ((isRequired || driverObject[driverMethodName]) && typeof driverObject[driverMethodName] !== "function") {
                    reject(complianceError);
                    return;
                  }
                }
                var configureMissingMethods = function configureMissingMethods2() {
                  var methodNotImplementedFactory = function methodNotImplementedFactory2(methodName) {
                    return function() {
                      var error = new Error("Method " + methodName + " is not implemented by the current driver");
                      var promise2 = Promise$1.reject(error);
                      executeCallback(promise2, arguments[arguments.length - 1]);
                      return promise2;
                    };
                  };
                  for (var _i = 0, _len = OptionalDriverMethods.length; _i < _len; _i++) {
                    var optionalDriverMethod = OptionalDriverMethods[_i];
                    if (!driverObject[optionalDriverMethod]) {
                      driverObject[optionalDriverMethod] = methodNotImplementedFactory(optionalDriverMethod);
                    }
                  }
                };
                configureMissingMethods();
                var setDriverSupport = function setDriverSupport2(support) {
                  if (DefinedDrivers[driverName]) {
                    console.info("Redefining LocalForage driver: " + driverName);
                  }
                  DefinedDrivers[driverName] = driverObject;
                  DriverSupport[driverName] = support;
                  resolve();
                };
                if ("_support" in driverObject) {
                  if (driverObject._support && typeof driverObject._support === "function") {
                    driverObject._support().then(setDriverSupport, reject);
                  } else {
                    setDriverSupport(!!driverObject._support);
                  }
                } else {
                  setDriverSupport(true);
                }
              } catch (e) {
                reject(e);
              }
            });
            executeTwoCallbacks(promise, callback, errorCallback);
            return promise;
          };
          LocalForage2.prototype.driver = function driver() {
            return this._driver || null;
          };
          LocalForage2.prototype.getDriver = function getDriver(driverName, callback, errorCallback) {
            var getDriverPromise = DefinedDrivers[driverName] ? Promise$1.resolve(DefinedDrivers[driverName]) : Promise$1.reject(new Error("Driver not found."));
            executeTwoCallbacks(getDriverPromise, callback, errorCallback);
            return getDriverPromise;
          };
          LocalForage2.prototype.getSerializer = function getSerializer(callback) {
            var serializerPromise = Promise$1.resolve(localforageSerializer);
            executeTwoCallbacks(serializerPromise, callback);
            return serializerPromise;
          };
          LocalForage2.prototype.ready = function ready(callback) {
            var self2 = this;
            var promise = self2._driverSet.then(function() {
              if (self2._ready === null) {
                self2._ready = self2._initDriver();
              }
              return self2._ready;
            });
            executeTwoCallbacks(promise, callback, callback);
            return promise;
          };
          LocalForage2.prototype.setDriver = function setDriver(drivers, callback, errorCallback) {
            var self2 = this;
            if (!isArray(drivers)) {
              drivers = [drivers];
            }
            var supportedDrivers = this._getSupportedDrivers(drivers);
            function setDriverToConfig() {
              self2._config.driver = self2.driver();
            }
            function extendSelfWithDriver(driver) {
              self2._extend(driver);
              setDriverToConfig();
              self2._ready = self2._initStorage(self2._config);
              return self2._ready;
            }
            function initDriver(supportedDrivers2) {
              return function() {
                var currentDriverIndex = 0;
                function driverPromiseLoop() {
                  while (currentDriverIndex < supportedDrivers2.length) {
                    var driverName = supportedDrivers2[currentDriverIndex];
                    currentDriverIndex++;
                    self2._dbInfo = null;
                    self2._ready = null;
                    return self2.getDriver(driverName).then(extendSelfWithDriver)["catch"](driverPromiseLoop);
                  }
                  setDriverToConfig();
                  var error = new Error("No available storage method found.");
                  self2._driverSet = Promise$1.reject(error);
                  return self2._driverSet;
                }
                return driverPromiseLoop();
              };
            }
            var oldDriverSetDone = this._driverSet !== null ? this._driverSet["catch"](function() {
              return Promise$1.resolve();
            }) : Promise$1.resolve();
            this._driverSet = oldDriverSetDone.then(function() {
              var driverName = supportedDrivers[0];
              self2._dbInfo = null;
              self2._ready = null;
              return self2.getDriver(driverName).then(function(driver) {
                self2._driver = driver._driver;
                setDriverToConfig();
                self2._wrapLibraryMethodsWithReady();
                self2._initDriver = initDriver(supportedDrivers);
              });
            })["catch"](function() {
              setDriverToConfig();
              var error = new Error("No available storage method found.");
              self2._driverSet = Promise$1.reject(error);
              return self2._driverSet;
            });
            executeTwoCallbacks(this._driverSet, callback, errorCallback);
            return this._driverSet;
          };
          LocalForage2.prototype.supports = function supports(driverName) {
            return !!DriverSupport[driverName];
          };
          LocalForage2.prototype._extend = function _extend(libraryMethodsAndProperties) {
            extend(this, libraryMethodsAndProperties);
          };
          LocalForage2.prototype._getSupportedDrivers = function _getSupportedDrivers(drivers) {
            var supportedDrivers = [];
            for (var i = 0, len = drivers.length; i < len; i++) {
              var driverName = drivers[i];
              if (this.supports(driverName)) {
                supportedDrivers.push(driverName);
              }
            }
            return supportedDrivers;
          };
          LocalForage2.prototype._wrapLibraryMethodsWithReady = function _wrapLibraryMethodsWithReady() {
            for (var i = 0, len = LibraryMethods.length; i < len; i++) {
              callWhenReady(this, LibraryMethods[i]);
            }
          };
          LocalForage2.prototype.createInstance = function createInstance(options) {
            return new LocalForage2(options);
          };
          return LocalForage2;
        }();
        var localforage_js = new LocalForage();
        module3.exports = localforage_js;
      }, { "3": 3 }] }, {}, [4])(4);
    });
  })(localforage$1);
  const localforage = localforageExports;
  const getBookFile = (bookId) => {
    console.warn(`${DOWNLOAD_PREFIX}-${bookId}`);
    return localforage.getItem(`${DOWNLOAD_PREFIX}-${bookId}`);
  };
  function isGlobalObj(obj) {
    return obj && obj.Math == Math ? obj : void 0;
  }
  var GLOBAL = typeof globalThis == "object" && isGlobalObj(globalThis) || typeof window == "object" && isGlobalObj(window) || typeof self == "object" && isGlobalObj(self) || typeof global == "object" && isGlobalObj(global) || function() {
    return this;
  }() || {};
  function getGlobalObject() {
    return GLOBAL;
  }
  function getGlobalSingleton(name, creator, obj) {
    var global2 = obj || GLOBAL;
    var __SENTRY__ = global2.__SENTRY__ = global2.__SENTRY__ || {};
    var singleton = __SENTRY__[name] || (__SENTRY__[name] = creator());
    return singleton;
  }
  var objectToString = Object.prototype.toString;
  function isBuiltin(wat, className) {
    return objectToString.call(wat) === `[object ${className}]`;
  }
  function isPlainObject(wat) {
    return isBuiltin(wat, "Object");
  }
  function isThenable(wat) {
    return Boolean(wat && wat.then && typeof wat.then === "function");
  }
  var global$1 = getGlobalObject();
  var PREFIX = "Sentry Logger ";
  var CONSOLE_LEVELS = ["debug", "info", "warn", "error", "log", "assert", "trace"];
  function consoleSandbox(callback) {
    var global2 = getGlobalObject();
    if (!("console" in global2)) {
      return callback();
    }
    var originalConsole = global2.console;
    var wrappedLevels = {};
    CONSOLE_LEVELS.forEach((level) => {
      var originalWrappedFunc = originalConsole[level] && originalConsole[level].__sentry_original__;
      if (level in global2.console && originalWrappedFunc) {
        wrappedLevels[level] = originalConsole[level];
        originalConsole[level] = originalWrappedFunc;
      }
    });
    try {
      return callback();
    } finally {
      Object.keys(wrappedLevels).forEach((level) => {
        originalConsole[level] = wrappedLevels[level];
      });
    }
  }
  function makeLogger() {
    let enabled = false;
    var logger2 = {
      enable: () => {
        enabled = true;
      },
      disable: () => {
        enabled = false;
      }
    };
    if (typeof __SENTRY_DEBUG__ === "undefined" || __SENTRY_DEBUG__) {
      CONSOLE_LEVELS.forEach((name) => {
        logger2[name] = (...args) => {
          if (enabled) {
            consoleSandbox(() => {
              global$1.console[name](`${PREFIX}[${name}]:`, ...args);
            });
          }
        };
      });
    } else {
      CONSOLE_LEVELS.forEach((name) => {
        logger2[name] = () => void 0;
      });
    }
    return logger2;
  }
  let logger;
  if (typeof __SENTRY_DEBUG__ === "undefined" || __SENTRY_DEBUG__) {
    logger = getGlobalSingleton("logger", makeLogger);
  } else {
    logger = makeLogger();
  }
  function dropUndefinedKeys(inputValue) {
    var memoizationMap = /* @__PURE__ */ new Map();
    return _dropUndefinedKeys(inputValue, memoizationMap);
  }
  function _dropUndefinedKeys(inputValue, memoizationMap) {
    if (isPlainObject(inputValue)) {
      var memoVal = memoizationMap.get(inputValue);
      if (memoVal !== void 0) {
        return memoVal;
      }
      var returnValue = {};
      memoizationMap.set(inputValue, returnValue);
      for (var key of Object.keys(inputValue)) {
        if (typeof inputValue[key] !== "undefined") {
          returnValue[key] = _dropUndefinedKeys(inputValue[key], memoizationMap);
        }
      }
      return returnValue;
    }
    if (Array.isArray(inputValue)) {
      var memoVal = memoizationMap.get(inputValue);
      if (memoVal !== void 0) {
        return memoVal;
      }
      var returnValue = [];
      memoizationMap.set(inputValue, returnValue);
      inputValue.forEach((item) => {
        returnValue.push(_dropUndefinedKeys(item, memoizationMap));
      });
      return returnValue;
    }
    return inputValue;
  }
  function uuid4() {
    var global2 = getGlobalObject();
    var crypto = global2.crypto || global2.msCrypto;
    if (crypto && crypto.randomUUID) {
      return crypto.randomUUID().replace(/-/g, "");
    }
    var getRandomByte = crypto && crypto.getRandomValues ? () => crypto.getRandomValues(new Uint8Array(1))[0] : () => Math.random() * 16;
    return ([1e7] + 1e3 + 4e3 + 8e3 + 1e11).replace(
      /[018]/g,
      (c) => (c ^ (getRandomByte() & 15) >> c / 4).toString(16)
    );
  }
  function arrayify(maybeArray) {
    return Array.isArray(maybeArray) ? maybeArray : [maybeArray];
  }
  function isBrowserBundle() {
    return typeof __SENTRY_BROWSER_BUNDLE__ !== "undefined" && !!__SENTRY_BROWSER_BUNDLE__;
  }
  function isNodeEnv() {
    return !isBrowserBundle() && Object.prototype.toString.call(typeof process !== "undefined" ? process : 0) === "[object process]";
  }
  function dynamicRequire(mod, request) {
    return mod.require(request);
  }
  var States;
  (function(States2) {
    var PENDING = 0;
    States2[States2["PENDING"] = PENDING] = "PENDING";
    var RESOLVED = 1;
    States2[States2["RESOLVED"] = RESOLVED] = "RESOLVED";
    var REJECTED = 2;
    States2[States2["REJECTED"] = REJECTED] = "REJECTED";
  })(States || (States = {}));
  class SyncPromise {
    __init() {
      this._state = States.PENDING;
    }
    __init2() {
      this._handlers = [];
    }
    constructor(executor) {
      SyncPromise.prototype.__init.call(this);
      SyncPromise.prototype.__init2.call(this);
      SyncPromise.prototype.__init3.call(this);
      SyncPromise.prototype.__init4.call(this);
      SyncPromise.prototype.__init5.call(this);
      SyncPromise.prototype.__init6.call(this);
      try {
        executor(this._resolve, this._reject);
      } catch (e) {
        this._reject(e);
      }
    }
    then(onfulfilled, onrejected) {
      return new SyncPromise((resolve, reject) => {
        this._handlers.push([
          false,
          (result) => {
            if (!onfulfilled) {
              resolve(result);
            } else {
              try {
                resolve(onfulfilled(result));
              } catch (e) {
                reject(e);
              }
            }
          },
          (reason) => {
            if (!onrejected) {
              reject(reason);
            } else {
              try {
                resolve(onrejected(reason));
              } catch (e) {
                reject(e);
              }
            }
          }
        ]);
        this._executeHandlers();
      });
    }
    catch(onrejected) {
      return this.then((val) => val, onrejected);
    }
    finally(onfinally) {
      return new SyncPromise((resolve, reject) => {
        let val;
        let isRejected;
        return this.then(
          (value) => {
            isRejected = false;
            val = value;
            if (onfinally) {
              onfinally();
            }
          },
          (reason) => {
            isRejected = true;
            val = reason;
            if (onfinally) {
              onfinally();
            }
          }
        ).then(() => {
          if (isRejected) {
            reject(val);
            return;
          }
          resolve(val);
        });
      });
    }
    __init3() {
      this._resolve = (value) => {
        this._setResult(States.RESOLVED, value);
      };
    }
    __init4() {
      this._reject = (reason) => {
        this._setResult(States.REJECTED, reason);
      };
    }
    __init5() {
      this._setResult = (state, value) => {
        if (this._state !== States.PENDING) {
          return;
        }
        if (isThenable(value)) {
          void value.then(this._resolve, this._reject);
          return;
        }
        this._state = state;
        this._value = value;
        this._executeHandlers();
      };
    }
    __init6() {
      this._executeHandlers = () => {
        if (this._state === States.PENDING) {
          return;
        }
        var cachedHandlers = this._handlers.slice();
        this._handlers = [];
        cachedHandlers.forEach((handler) => {
          if (handler[0]) {
            return;
          }
          if (this._state === States.RESOLVED) {
            handler[1](this._value);
          }
          if (this._state === States.REJECTED) {
            handler[2](this._value);
          }
          handler[0] = true;
        });
      };
    }
  }
  var dateTimestampSource = {
    nowSeconds: () => Date.now() / 1e3
  };
  function getBrowserPerformance() {
    const { performance: performance2 } = getGlobalObject();
    if (!performance2 || !performance2.now) {
      return void 0;
    }
    var timeOrigin = Date.now() - performance2.now();
    return {
      now: () => performance2.now(),
      timeOrigin
    };
  }
  function getNodePerformance() {
    try {
      var perfHooks = dynamicRequire(module, "perf_hooks");
      return perfHooks.performance;
    } catch (_2) {
      return void 0;
    }
  }
  var platformPerformance = isNodeEnv() ? getNodePerformance() : getBrowserPerformance();
  var timestampSource = platformPerformance === void 0 ? dateTimestampSource : {
    nowSeconds: () => (platformPerformance.timeOrigin + platformPerformance.now()) / 1e3
  };
  var dateTimestampInSeconds = dateTimestampSource.nowSeconds.bind(dateTimestampSource);
  var timestampInSeconds = timestampSource.nowSeconds.bind(timestampSource);
  (() => {
    const { performance: performance2 } = getGlobalObject();
    if (!performance2 || !performance2.now) {
      return void 0;
    }
    var threshold = 3600 * 1e3;
    var performanceNow = performance2.now();
    var dateNow = Date.now();
    var timeOriginDelta = performance2.timeOrigin ? Math.abs(performance2.timeOrigin + performanceNow - dateNow) : threshold;
    var timeOriginIsReliable = timeOriginDelta < threshold;
    var navigationStart = performance2.timing && performance2.timing.navigationStart;
    var hasNavigationStart = typeof navigationStart === "number";
    var navigationStartDelta = hasNavigationStart ? Math.abs(navigationStart + performanceNow - dateNow) : threshold;
    var navigationStartIsReliable = navigationStartDelta < threshold;
    if (timeOriginIsReliable || navigationStartIsReliable) {
      if (timeOriginDelta <= navigationStartDelta) {
        return performance2.timeOrigin;
      } else {
        return navigationStart;
      }
    }
    return dateNow;
  })();
  function makeSession(context) {
    var startingTime = timestampInSeconds();
    var session = {
      sid: uuid4(),
      init: true,
      timestamp: startingTime,
      started: startingTime,
      duration: 0,
      status: "ok",
      errors: 0,
      ignoreDuration: false,
      toJSON: () => sessionToJSON(session)
    };
    if (context) {
      updateSession(session, context);
    }
    return session;
  }
  function updateSession(session, context = {}) {
    if (context.user) {
      if (!session.ipAddress && context.user.ip_address) {
        session.ipAddress = context.user.ip_address;
      }
      if (!session.did && !context.did) {
        session.did = context.user.id || context.user.email || context.user.username;
      }
    }
    session.timestamp = context.timestamp || timestampInSeconds();
    if (context.ignoreDuration) {
      session.ignoreDuration = context.ignoreDuration;
    }
    if (context.sid) {
      session.sid = context.sid.length === 32 ? context.sid : uuid4();
    }
    if (context.init !== void 0) {
      session.init = context.init;
    }
    if (!session.did && context.did) {
      session.did = `${context.did}`;
    }
    if (typeof context.started === "number") {
      session.started = context.started;
    }
    if (session.ignoreDuration) {
      session.duration = void 0;
    } else if (typeof context.duration === "number") {
      session.duration = context.duration;
    } else {
      var duration = session.timestamp - session.started;
      session.duration = duration >= 0 ? duration : 0;
    }
    if (context.release) {
      session.release = context.release;
    }
    if (context.environment) {
      session.environment = context.environment;
    }
    if (!session.ipAddress && context.ipAddress) {
      session.ipAddress = context.ipAddress;
    }
    if (!session.userAgent && context.userAgent) {
      session.userAgent = context.userAgent;
    }
    if (typeof context.errors === "number") {
      session.errors = context.errors;
    }
    if (context.status) {
      session.status = context.status;
    }
  }
  function closeSession(session, status) {
    let context = {};
    if (status) {
      context = { status };
    } else if (session.status === "ok") {
      context = { status: "exited" };
    }
    updateSession(session, context);
  }
  function sessionToJSON(session) {
    return dropUndefinedKeys({
      sid: `${session.sid}`,
      init: session.init,
      started: new Date(session.started * 1e3).toISOString(),
      timestamp: new Date(session.timestamp * 1e3).toISOString(),
      status: session.status,
      errors: session.errors,
      did: typeof session.did === "number" || typeof session.did === "string" ? `${session.did}` : void 0,
      duration: session.duration,
      attrs: {
        release: session.release,
        environment: session.environment,
        ip_address: session.ipAddress,
        user_agent: session.userAgent
      }
    });
  }
  var DEFAULT_MAX_BREADCRUMBS = 100;
  class Scope {
    constructor() {
      this._notifyingListeners = false;
      this._scopeListeners = [];
      this._eventProcessors = [];
      this._breadcrumbs = [];
      this._attachments = [];
      this._user = {};
      this._tags = {};
      this._extra = {};
      this._contexts = {};
      this._sdkProcessingMetadata = {};
    }
    static clone(scope) {
      var newScope = new Scope();
      if (scope) {
        newScope._breadcrumbs = [...scope._breadcrumbs];
        newScope._tags = { ...scope._tags };
        newScope._extra = { ...scope._extra };
        newScope._contexts = { ...scope._contexts };
        newScope._user = scope._user;
        newScope._level = scope._level;
        newScope._span = scope._span;
        newScope._session = scope._session;
        newScope._transactionName = scope._transactionName;
        newScope._fingerprint = scope._fingerprint;
        newScope._eventProcessors = [...scope._eventProcessors];
        newScope._requestSession = scope._requestSession;
        newScope._attachments = [...scope._attachments];
      }
      return newScope;
    }
    addScopeListener(callback) {
      this._scopeListeners.push(callback);
    }
    addEventProcessor(callback) {
      this._eventProcessors.push(callback);
      return this;
    }
    setUser(user) {
      this._user = user || {};
      if (this._session) {
        updateSession(this._session, { user });
      }
      this._notifyScopeListeners();
      return this;
    }
    getUser() {
      return this._user;
    }
    getRequestSession() {
      return this._requestSession;
    }
    setRequestSession(requestSession) {
      this._requestSession = requestSession;
      return this;
    }
    setTags(tags) {
      this._tags = {
        ...this._tags,
        ...tags
      };
      this._notifyScopeListeners();
      return this;
    }
    setTag(key, value) {
      this._tags = { ...this._tags, [key]: value };
      this._notifyScopeListeners();
      return this;
    }
    setExtras(extras) {
      this._extra = {
        ...this._extra,
        ...extras
      };
      this._notifyScopeListeners();
      return this;
    }
    setExtra(key, extra) {
      this._extra = { ...this._extra, [key]: extra };
      this._notifyScopeListeners();
      return this;
    }
    setFingerprint(fingerprint) {
      this._fingerprint = fingerprint;
      this._notifyScopeListeners();
      return this;
    }
    setLevel(level) {
      this._level = level;
      this._notifyScopeListeners();
      return this;
    }
    setTransactionName(name) {
      this._transactionName = name;
      this._notifyScopeListeners();
      return this;
    }
    setContext(key, context) {
      if (context === null) {
        delete this._contexts[key];
      } else {
        this._contexts = { ...this._contexts, [key]: context };
      }
      this._notifyScopeListeners();
      return this;
    }
    setSpan(span) {
      this._span = span;
      this._notifyScopeListeners();
      return this;
    }
    getSpan() {
      return this._span;
    }
    getTransaction() {
      var span = this.getSpan();
      return span && span.transaction;
    }
    setSession(session) {
      if (!session) {
        delete this._session;
      } else {
        this._session = session;
      }
      this._notifyScopeListeners();
      return this;
    }
    getSession() {
      return this._session;
    }
    update(captureContext) {
      if (!captureContext) {
        return this;
      }
      if (typeof captureContext === "function") {
        var updatedScope = captureContext(this);
        return updatedScope instanceof Scope ? updatedScope : this;
      }
      if (captureContext instanceof Scope) {
        this._tags = { ...this._tags, ...captureContext._tags };
        this._extra = { ...this._extra, ...captureContext._extra };
        this._contexts = { ...this._contexts, ...captureContext._contexts };
        if (captureContext._user && Object.keys(captureContext._user).length) {
          this._user = captureContext._user;
        }
        if (captureContext._level) {
          this._level = captureContext._level;
        }
        if (captureContext._fingerprint) {
          this._fingerprint = captureContext._fingerprint;
        }
        if (captureContext._requestSession) {
          this._requestSession = captureContext._requestSession;
        }
      } else if (isPlainObject(captureContext)) {
        captureContext = captureContext;
        this._tags = { ...this._tags, ...captureContext.tags };
        this._extra = { ...this._extra, ...captureContext.extra };
        this._contexts = { ...this._contexts, ...captureContext.contexts };
        if (captureContext.user) {
          this._user = captureContext.user;
        }
        if (captureContext.level) {
          this._level = captureContext.level;
        }
        if (captureContext.fingerprint) {
          this._fingerprint = captureContext.fingerprint;
        }
        if (captureContext.requestSession) {
          this._requestSession = captureContext.requestSession;
        }
      }
      return this;
    }
    clear() {
      this._breadcrumbs = [];
      this._tags = {};
      this._extra = {};
      this._user = {};
      this._contexts = {};
      this._level = void 0;
      this._transactionName = void 0;
      this._fingerprint = void 0;
      this._requestSession = void 0;
      this._span = void 0;
      this._session = void 0;
      this._notifyScopeListeners();
      this._attachments = [];
      return this;
    }
    addBreadcrumb(breadcrumb, maxBreadcrumbs) {
      var maxCrumbs = typeof maxBreadcrumbs === "number" ? maxBreadcrumbs : DEFAULT_MAX_BREADCRUMBS;
      if (maxCrumbs <= 0) {
        return this;
      }
      var mergedBreadcrumb = {
        timestamp: dateTimestampInSeconds(),
        ...breadcrumb
      };
      this._breadcrumbs = [...this._breadcrumbs, mergedBreadcrumb].slice(-maxCrumbs);
      this._notifyScopeListeners();
      return this;
    }
    clearBreadcrumbs() {
      this._breadcrumbs = [];
      this._notifyScopeListeners();
      return this;
    }
    addAttachment(attachment) {
      this._attachments.push(attachment);
      return this;
    }
    getAttachments() {
      return this._attachments;
    }
    clearAttachments() {
      this._attachments = [];
      return this;
    }
    applyToEvent(event, hint = {}) {
      if (this._extra && Object.keys(this._extra).length) {
        event.extra = { ...this._extra, ...event.extra };
      }
      if (this._tags && Object.keys(this._tags).length) {
        event.tags = { ...this._tags, ...event.tags };
      }
      if (this._user && Object.keys(this._user).length) {
        event.user = { ...this._user, ...event.user };
      }
      if (this._contexts && Object.keys(this._contexts).length) {
        event.contexts = { ...this._contexts, ...event.contexts };
      }
      if (this._level) {
        event.level = this._level;
      }
      if (this._transactionName) {
        event.transaction = this._transactionName;
      }
      if (this._span) {
        event.contexts = { trace: this._span.getTraceContext(), ...event.contexts };
        var transactionName = this._span.transaction && this._span.transaction.name;
        if (transactionName) {
          event.tags = { transaction: transactionName, ...event.tags };
        }
      }
      this._applyFingerprint(event);
      event.breadcrumbs = [...event.breadcrumbs || [], ...this._breadcrumbs];
      event.breadcrumbs = event.breadcrumbs.length > 0 ? event.breadcrumbs : void 0;
      event.sdkProcessingMetadata = { ...event.sdkProcessingMetadata, ...this._sdkProcessingMetadata };
      return this._notifyEventProcessors([...getGlobalEventProcessors(), ...this._eventProcessors], event, hint);
    }
    setSDKProcessingMetadata(newData) {
      this._sdkProcessingMetadata = { ...this._sdkProcessingMetadata, ...newData };
      return this;
    }
    _notifyEventProcessors(processors, event, hint, index = 0) {
      return new SyncPromise((resolve, reject) => {
        var processor = processors[index];
        if (event === null || typeof processor !== "function") {
          resolve(event);
        } else {
          var result = processor({ ...event }, hint);
          (typeof __SENTRY_DEBUG__ === "undefined" || __SENTRY_DEBUG__) && processor.id && result === null && logger.log(`Event processor "${processor.id}" dropped event`);
          if (isThenable(result)) {
            void result.then((final) => this._notifyEventProcessors(processors, final, hint, index + 1).then(resolve)).then(null, reject);
          } else {
            void this._notifyEventProcessors(processors, result, hint, index + 1).then(resolve).then(null, reject);
          }
        }
      });
    }
    _notifyScopeListeners() {
      if (!this._notifyingListeners) {
        this._notifyingListeners = true;
        this._scopeListeners.forEach((callback) => {
          callback(this);
        });
        this._notifyingListeners = false;
      }
    }
    _applyFingerprint(event) {
      event.fingerprint = event.fingerprint ? arrayify(event.fingerprint) : [];
      if (this._fingerprint) {
        event.fingerprint = event.fingerprint.concat(this._fingerprint);
      }
      if (event.fingerprint && !event.fingerprint.length) {
        delete event.fingerprint;
      }
    }
  }
  function getGlobalEventProcessors() {
    return getGlobalSingleton("globalEventProcessors", () => []);
  }
  var API_VERSION = 4;
  var DEFAULT_BREADCRUMBS = 100;
  class Hub {
    __init() {
      this._stack = [{}];
    }
    constructor(client, scope = new Scope(), _version = API_VERSION) {
      this._version = _version;
      Hub.prototype.__init.call(this);
      this.getStackTop().scope = scope;
      if (client) {
        this.bindClient(client);
      }
    }
    isOlderThan(version) {
      return this._version < version;
    }
    bindClient(client) {
      var top = this.getStackTop();
      top.client = client;
      if (client && client.setupIntegrations) {
        client.setupIntegrations();
      }
    }
    pushScope() {
      var scope = Scope.clone(this.getScope());
      this.getStack().push({
        client: this.getClient(),
        scope
      });
      return scope;
    }
    popScope() {
      if (this.getStack().length <= 1)
        return false;
      return !!this.getStack().pop();
    }
    withScope(callback) {
      var scope = this.pushScope();
      try {
        callback(scope);
      } finally {
        this.popScope();
      }
    }
    getClient() {
      return this.getStackTop().client;
    }
    getScope() {
      return this.getStackTop().scope;
    }
    getStack() {
      return this._stack;
    }
    getStackTop() {
      return this._stack[this._stack.length - 1];
    }
    captureException(exception, hint) {
      var eventId = this._lastEventId = hint && hint.event_id ? hint.event_id : uuid4();
      var syntheticException = new Error("Sentry syntheticException");
      this._withClient((client, scope) => {
        client.captureException(
          exception,
          {
            originalException: exception,
            syntheticException,
            ...hint,
            event_id: eventId
          },
          scope
        );
      });
      return eventId;
    }
    captureMessage(message, level, hint) {
      var eventId = this._lastEventId = hint && hint.event_id ? hint.event_id : uuid4();
      var syntheticException = new Error(message);
      this._withClient((client, scope) => {
        client.captureMessage(
          message,
          level,
          {
            originalException: message,
            syntheticException,
            ...hint,
            event_id: eventId
          },
          scope
        );
      });
      return eventId;
    }
    captureEvent(event, hint) {
      var eventId = hint && hint.event_id ? hint.event_id : uuid4();
      if (event.type !== "transaction") {
        this._lastEventId = eventId;
      }
      this._withClient((client, scope) => {
        client.captureEvent(event, { ...hint, event_id: eventId }, scope);
      });
      return eventId;
    }
    lastEventId() {
      return this._lastEventId;
    }
    addBreadcrumb(breadcrumb, hint) {
      const { scope, client } = this.getStackTop();
      if (!scope || !client)
        return;
      const { beforeBreadcrumb = null, maxBreadcrumbs = DEFAULT_BREADCRUMBS } = client.getOptions && client.getOptions() || {};
      if (maxBreadcrumbs <= 0)
        return;
      var timestamp = dateTimestampInSeconds();
      var mergedBreadcrumb = { timestamp, ...breadcrumb };
      var finalBreadcrumb = beforeBreadcrumb ? consoleSandbox(() => beforeBreadcrumb(mergedBreadcrumb, hint)) : mergedBreadcrumb;
      if (finalBreadcrumb === null)
        return;
      scope.addBreadcrumb(finalBreadcrumb, maxBreadcrumbs);
    }
    setUser(user) {
      var scope = this.getScope();
      if (scope)
        scope.setUser(user);
    }
    setTags(tags) {
      var scope = this.getScope();
      if (scope)
        scope.setTags(tags);
    }
    setExtras(extras) {
      var scope = this.getScope();
      if (scope)
        scope.setExtras(extras);
    }
    setTag(key, value) {
      var scope = this.getScope();
      if (scope)
        scope.setTag(key, value);
    }
    setExtra(key, extra) {
      var scope = this.getScope();
      if (scope)
        scope.setExtra(key, extra);
    }
    setContext(name, context) {
      var scope = this.getScope();
      if (scope)
        scope.setContext(name, context);
    }
    configureScope(callback) {
      const { scope, client } = this.getStackTop();
      if (scope && client) {
        callback(scope);
      }
    }
    run(callback) {
      var oldHub = makeMain(this);
      try {
        callback(this);
      } finally {
        makeMain(oldHub);
      }
    }
    getIntegration(integration) {
      var client = this.getClient();
      if (!client)
        return null;
      try {
        return client.getIntegration(integration);
      } catch (_oO) {
        (typeof __SENTRY_DEBUG__ === "undefined" || __SENTRY_DEBUG__) && logger.warn(`Cannot retrieve integration ${integration.id} from the current Hub`);
        return null;
      }
    }
    startTransaction(context, customSamplingContext) {
      return this._callExtensionMethod("startTransaction", context, customSamplingContext);
    }
    traceHeaders() {
      return this._callExtensionMethod("traceHeaders");
    }
    captureSession(endSession = false) {
      if (endSession) {
        return this.endSession();
      }
      this._sendSessionUpdate();
    }
    endSession() {
      var layer = this.getStackTop();
      var scope = layer && layer.scope;
      var session = scope && scope.getSession();
      if (session) {
        closeSession(session);
      }
      this._sendSessionUpdate();
      if (scope) {
        scope.setSession();
      }
    }
    startSession(context) {
      const { scope, client } = this.getStackTop();
      const { release, environment } = client && client.getOptions() || {};
      var global2 = getGlobalObject();
      const { userAgent } = global2.navigator || {};
      var session = makeSession({
        release,
        environment,
        ...scope && { user: scope.getUser() },
        ...userAgent && { userAgent },
        ...context
      });
      if (scope) {
        var currentSession = scope.getSession && scope.getSession();
        if (currentSession && currentSession.status === "ok") {
          updateSession(currentSession, { status: "exited" });
        }
        this.endSession();
        scope.setSession(session);
      }
      return session;
    }
    shouldSendDefaultPii() {
      var client = this.getClient();
      var options = client && client.getOptions();
      return Boolean(options && options.sendDefaultPii);
    }
    _sendSessionUpdate() {
      const { scope, client } = this.getStackTop();
      if (!scope)
        return;
      var session = scope.getSession();
      if (session) {
        if (client && client.captureSession) {
          client.captureSession(session);
        }
      }
    }
    _withClient(callback) {
      const { scope, client } = this.getStackTop();
      if (client) {
        callback(client, scope);
      }
    }
    _callExtensionMethod(method, ...args) {
      var carrier = getMainCarrier();
      var sentry = carrier.__SENTRY__;
      if (sentry && sentry.extensions && typeof sentry.extensions[method] === "function") {
        return sentry.extensions[method].apply(this, args);
      }
      (typeof __SENTRY_DEBUG__ === "undefined" || __SENTRY_DEBUG__) && logger.warn(`Extension method ${method} couldn't be found, doing nothing.`);
    }
  }
  function getMainCarrier() {
    var carrier = getGlobalObject();
    carrier.__SENTRY__ = carrier.__SENTRY__ || {
      extensions: {},
      hub: void 0
    };
    return carrier;
  }
  function makeMain(hub) {
    var registry = getMainCarrier();
    var oldHub = getHubFromCarrier(registry);
    setHubOnCarrier(registry, hub);
    return oldHub;
  }
  function getCurrentHub() {
    var registry = getMainCarrier();
    if (!hasHubOnCarrier(registry) || getHubFromCarrier(registry).isOlderThan(API_VERSION)) {
      setHubOnCarrier(registry, new Hub());
    }
    if (isNodeEnv()) {
      return getHubFromActiveDomain(registry);
    }
    return getHubFromCarrier(registry);
  }
  function getHubFromActiveDomain(registry) {
    try {
      var sentry = getMainCarrier().__SENTRY__;
      var activeDomain = sentry && sentry.extensions && sentry.extensions.domain && sentry.extensions.domain.active;
      if (!activeDomain) {
        return getHubFromCarrier(registry);
      }
      if (!hasHubOnCarrier(activeDomain) || getHubFromCarrier(activeDomain).isOlderThan(API_VERSION)) {
        var registryHubTopStack = getHubFromCarrier(registry).getStackTop();
        setHubOnCarrier(activeDomain, new Hub(registryHubTopStack.client, Scope.clone(registryHubTopStack.scope)));
      }
      return getHubFromCarrier(activeDomain);
    } catch (_Oo) {
      return getHubFromCarrier(registry);
    }
  }
  function hasHubOnCarrier(carrier) {
    return !!(carrier && carrier.__SENTRY__ && carrier.__SENTRY__.hub);
  }
  function getHubFromCarrier(carrier) {
    return getGlobalSingleton("hub", () => new Hub(), carrier);
  }
  function setHubOnCarrier(carrier, hub) {
    if (!carrier)
      return false;
    var __SENTRY__ = carrier.__SENTRY__ = carrier.__SENTRY__ || {};
    __SENTRY__.hub = hub;
    return true;
  }
  function captureException(exception, captureContext) {
    return getCurrentHub().captureException(exception, { captureContext });
  }
  function captureMessage(message, captureContext) {
    var level = typeof captureContext === "string" ? captureContext : void 0;
    var context = typeof captureContext !== "string" ? { captureContext } : void 0;
    return getCurrentHub().captureMessage(message, level, context);
  }
  let isEnabled = typeof window === "undefined" || !window.localStorage ? false : localStorage.getItem("oboku_debug_enabled") === "true";
  const isDebugEnabled = () => {
    return isEnabled || false;
  };
  const Report = {
    log: (...data) => {
      if (isDebugEnabled()) {
        console.log(`[oboku:log]`, ...data);
      }
    },
    error: (err) => {
      {
        captureException(err);
      }
      console.error(err);
    },
    captureMessage: (message, captureContext) => {
      captureMessage(message, captureContext);
    },
    warn: (message) => {
      if (isDebugEnabled()) {
        console.warn(`[oboku:warning]`, message);
      }
    },
    metric: (performanceEntry, targetDuration = Infinity) => {
      const duration = typeof performanceEntry === "number" ? performanceEntry : performanceEntry.duration;
      if (isDebugEnabled()) {
        if (performanceEntry.duration <= targetDuration) {
          console.log(
            `[oboku:metric] `,
            `${performanceEntry.name} took ${duration}ms`
          );
        } else {
          console.warn(
            `[oboku:metric] `,
            `${performanceEntry.name} took ${performanceEntry.duration}ms which is above the ${targetDuration}ms target for this function`
          );
        }
      }
    },
    measurePerformance: (name, targetDuration = 10, functionToMeasure) => {
      return (...args) => {
        const t0 = performance.now();
        const response = functionToMeasure(...args);
        if (response && response.then) {
          return response.then((res) => {
            const t12 = performance.now();
            Report.metric({ name, duration: t12 - t0 }, targetDuration);
            return res;
          });
        }
        const t1 = performance.now();
        Report.metric({ name, duration: t1 - t0 }, targetDuration);
        return response;
      };
    }
  };
  var jszip_minExports = {};
  var jszip_min = {
    get exports() {
      return jszip_minExports;
    },
    set exports(v) {
      jszip_minExports = v;
    }
  };
  /*!
  
      JSZip v3.10.0 - A JavaScript class for generating and reading zip files
      <http://stuartk.com/jszip>
  
      (c) 2009-2016 Stuart Knightley <stuart [at] stuartk.com>
      Dual licenced under the MIT license or GPLv3. See https://raw.github.com/Stuk/jszip/main/LICENSE.markdown.
  
      JSZip uses the library pako released under the MIT license :
      https://github.com/nodeca/pako/blob/main/LICENSE
      */
  (function(module2, exports) {
    !function(e) {
      module2.exports = e();
    }(function() {
      return function s(a, o, h) {
        function u(r, e2) {
          if (!o[r]) {
            if (!a[r]) {
              var t = "function" == typeof commonjsRequire && commonjsRequire;
              if (!e2 && t)
                return t(r, true);
              if (l)
                return l(r, true);
              var n = new Error("Cannot find module '" + r + "'");
              throw n.code = "MODULE_NOT_FOUND", n;
            }
            var i = o[r] = { exports: {} };
            a[r][0].call(i.exports, function(e3) {
              var t2 = a[r][1][e3];
              return u(t2 || e3);
            }, i, i.exports, s, a, o, h);
          }
          return o[r].exports;
        }
        for (var l = "function" == typeof commonjsRequire && commonjsRequire, e = 0; e < h.length; e++)
          u(h[e]);
        return u;
      }({ 1: [function(e, t, r) {
        var d = e("./utils"), c = e("./support"), p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        r.encode = function(e2) {
          for (var t2, r2, n, i, s, a, o, h = [], u = 0, l = e2.length, f = l, c2 = "string" !== d.getTypeOf(e2); u < e2.length; )
            f = l - u, n = c2 ? (t2 = e2[u++], r2 = u < l ? e2[u++] : 0, u < l ? e2[u++] : 0) : (t2 = e2.charCodeAt(u++), r2 = u < l ? e2.charCodeAt(u++) : 0, u < l ? e2.charCodeAt(u++) : 0), i = t2 >> 2, s = (3 & t2) << 4 | r2 >> 4, a = 1 < f ? (15 & r2) << 2 | n >> 6 : 64, o = 2 < f ? 63 & n : 64, h.push(p.charAt(i) + p.charAt(s) + p.charAt(a) + p.charAt(o));
          return h.join("");
        }, r.decode = function(e2) {
          var t2, r2, n, i, s, a, o = 0, h = 0, u = "data:";
          if (e2.substr(0, u.length) === u)
            throw new Error("Invalid base64 input, it looks like a data url.");
          var l, f = 3 * (e2 = e2.replace(/[^A-Za-z0-9\+\/\=]/g, "")).length / 4;
          if (e2.charAt(e2.length - 1) === p.charAt(64) && f--, e2.charAt(e2.length - 2) === p.charAt(64) && f--, f % 1 != 0)
            throw new Error("Invalid base64 input, bad content length.");
          for (l = c.uint8array ? new Uint8Array(0 | f) : new Array(0 | f); o < e2.length; )
            t2 = p.indexOf(e2.charAt(o++)) << 2 | (i = p.indexOf(e2.charAt(o++))) >> 4, r2 = (15 & i) << 4 | (s = p.indexOf(e2.charAt(o++))) >> 2, n = (3 & s) << 6 | (a = p.indexOf(e2.charAt(o++))), l[h++] = t2, 64 !== s && (l[h++] = r2), 64 !== a && (l[h++] = n);
          return l;
        };
      }, { "./support": 30, "./utils": 32 }], 2: [function(e, t, r) {
        var n = e("./external"), i = e("./stream/DataWorker"), s = e("./stream/Crc32Probe"), a = e("./stream/DataLengthProbe");
        function o(e2, t2, r2, n2, i2) {
          this.compressedSize = e2, this.uncompressedSize = t2, this.crc32 = r2, this.compression = n2, this.compressedContent = i2;
        }
        o.prototype = { getContentWorker: function() {
          var e2 = new i(n.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new a("data_length")), t2 = this;
          return e2.on("end", function() {
            if (this.streamInfo.data_length !== t2.uncompressedSize)
              throw new Error("Bug : uncompressed data size mismatch");
          }), e2;
        }, getCompressedWorker: function() {
          return new i(n.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize", this.compressedSize).withStreamInfo("uncompressedSize", this.uncompressedSize).withStreamInfo("crc32", this.crc32).withStreamInfo("compression", this.compression);
        } }, o.createWorkerFrom = function(e2, t2, r2) {
          return e2.pipe(new s()).pipe(new a("uncompressedSize")).pipe(t2.compressWorker(r2)).pipe(new a("compressedSize")).withStreamInfo("compression", t2);
        }, t.exports = o;
      }, { "./external": 6, "./stream/Crc32Probe": 25, "./stream/DataLengthProbe": 26, "./stream/DataWorker": 27 }], 3: [function(e, t, r) {
        var n = e("./stream/GenericWorker");
        r.STORE = { magic: "\0\0", compressWorker: function(e2) {
          return new n("STORE compression");
        }, uncompressWorker: function() {
          return new n("STORE decompression");
        } }, r.DEFLATE = e("./flate");
      }, { "./flate": 7, "./stream/GenericWorker": 28 }], 4: [function(e, t, r) {
        var n = e("./utils");
        var o = function() {
          for (var e2, t2 = [], r2 = 0; r2 < 256; r2++) {
            e2 = r2;
            for (var n2 = 0; n2 < 8; n2++)
              e2 = 1 & e2 ? 3988292384 ^ e2 >>> 1 : e2 >>> 1;
            t2[r2] = e2;
          }
          return t2;
        }();
        t.exports = function(e2, t2) {
          return void 0 !== e2 && e2.length ? "string" !== n.getTypeOf(e2) ? function(e3, t3, r2, n2) {
            var i = o, s = n2 + r2;
            e3 ^= -1;
            for (var a = n2; a < s; a++)
              e3 = e3 >>> 8 ^ i[255 & (e3 ^ t3[a])];
            return -1 ^ e3;
          }(0 | t2, e2, e2.length, 0) : function(e3, t3, r2, n2) {
            var i = o, s = n2 + r2;
            e3 ^= -1;
            for (var a = n2; a < s; a++)
              e3 = e3 >>> 8 ^ i[255 & (e3 ^ t3.charCodeAt(a))];
            return -1 ^ e3;
          }(0 | t2, e2, e2.length, 0) : 0;
        };
      }, { "./utils": 32 }], 5: [function(e, t, r) {
        r.base64 = false, r.binary = false, r.dir = false, r.createFolders = true, r.date = null, r.compression = null, r.compressionOptions = null, r.comment = null, r.unixPermissions = null, r.dosPermissions = null;
      }, {}], 6: [function(e, t, r) {
        var n = null;
        n = "undefined" != typeof Promise ? Promise : e("lie"), t.exports = { Promise: n };
      }, { lie: 37 }], 7: [function(e, t, r) {
        var n = "undefined" != typeof Uint8Array && "undefined" != typeof Uint16Array && "undefined" != typeof Uint32Array, i = e("pako"), s = e("./utils"), a = e("./stream/GenericWorker"), o = n ? "uint8array" : "array";
        function h(e2, t2) {
          a.call(this, "FlateWorker/" + e2), this._pako = null, this._pakoAction = e2, this._pakoOptions = t2, this.meta = {};
        }
        r.magic = "\b\0", s.inherits(h, a), h.prototype.processChunk = function(e2) {
          this.meta = e2.meta, null === this._pako && this._createPako(), this._pako.push(s.transformTo(o, e2.data), false);
        }, h.prototype.flush = function() {
          a.prototype.flush.call(this), null === this._pako && this._createPako(), this._pako.push([], true);
        }, h.prototype.cleanUp = function() {
          a.prototype.cleanUp.call(this), this._pako = null;
        }, h.prototype._createPako = function() {
          this._pako = new i[this._pakoAction]({ raw: true, level: this._pakoOptions.level || -1 });
          var t2 = this;
          this._pako.onData = function(e2) {
            t2.push({ data: e2, meta: t2.meta });
          };
        }, r.compressWorker = function(e2) {
          return new h("Deflate", e2);
        }, r.uncompressWorker = function() {
          return new h("Inflate", {});
        };
      }, { "./stream/GenericWorker": 28, "./utils": 32, pako: 38 }], 8: [function(e, t, r) {
        function A(e2, t2) {
          var r2, n2 = "";
          for (r2 = 0; r2 < t2; r2++)
            n2 += String.fromCharCode(255 & e2), e2 >>>= 8;
          return n2;
        }
        function n(e2, t2, r2, n2, i2, s2) {
          var a, o, h = e2.file, u = e2.compression, l = s2 !== O.utf8encode, f = I.transformTo("string", s2(h.name)), c = I.transformTo("string", O.utf8encode(h.name)), d = h.comment, p = I.transformTo("string", s2(d)), m = I.transformTo("string", O.utf8encode(d)), _2 = c.length !== h.name.length, g = m.length !== d.length, b = "", v = "", y = "", w = h.dir, k = h.date, x = { crc32: 0, compressedSize: 0, uncompressedSize: 0 };
          t2 && !r2 || (x.crc32 = e2.crc32, x.compressedSize = e2.compressedSize, x.uncompressedSize = e2.uncompressedSize);
          var S = 0;
          t2 && (S |= 8), l || !_2 && !g || (S |= 2048);
          var z = 0, C = 0;
          w && (z |= 16), "UNIX" === i2 ? (C = 798, z |= function(e3, t3) {
            var r3 = e3;
            return e3 || (r3 = t3 ? 16893 : 33204), (65535 & r3) << 16;
          }(h.unixPermissions, w)) : (C = 20, z |= function(e3) {
            return 63 & (e3 || 0);
          }(h.dosPermissions)), a = k.getUTCHours(), a <<= 6, a |= k.getUTCMinutes(), a <<= 5, a |= k.getUTCSeconds() / 2, o = k.getUTCFullYear() - 1980, o <<= 4, o |= k.getUTCMonth() + 1, o <<= 5, o |= k.getUTCDate(), _2 && (v = A(1, 1) + A(B(f), 4) + c, b += "up" + A(v.length, 2) + v), g && (y = A(1, 1) + A(B(p), 4) + m, b += "uc" + A(y.length, 2) + y);
          var E = "";
          return E += "\n\0", E += A(S, 2), E += u.magic, E += A(a, 2), E += A(o, 2), E += A(x.crc32, 4), E += A(x.compressedSize, 4), E += A(x.uncompressedSize, 4), E += A(f.length, 2), E += A(b.length, 2), { fileRecord: R.LOCAL_FILE_HEADER + E + f + b, dirRecord: R.CENTRAL_FILE_HEADER + A(C, 2) + E + A(p.length, 2) + "\0\0\0\0" + A(z, 4) + A(n2, 4) + f + b + p };
        }
        var I = e("../utils"), i = e("../stream/GenericWorker"), O = e("../utf8"), B = e("../crc32"), R = e("../signature");
        function s(e2, t2, r2, n2) {
          i.call(this, "ZipFileWorker"), this.bytesWritten = 0, this.zipComment = t2, this.zipPlatform = r2, this.encodeFileName = n2, this.streamFiles = e2, this.accumulate = false, this.contentBuffer = [], this.dirRecords = [], this.currentSourceOffset = 0, this.entriesCount = 0, this.currentFile = null, this._sources = [];
        }
        I.inherits(s, i), s.prototype.push = function(e2) {
          var t2 = e2.meta.percent || 0, r2 = this.entriesCount, n2 = this._sources.length;
          this.accumulate ? this.contentBuffer.push(e2) : (this.bytesWritten += e2.data.length, i.prototype.push.call(this, { data: e2.data, meta: { currentFile: this.currentFile, percent: r2 ? (t2 + 100 * (r2 - n2 - 1)) / r2 : 100 } }));
        }, s.prototype.openedSource = function(e2) {
          this.currentSourceOffset = this.bytesWritten, this.currentFile = e2.file.name;
          var t2 = this.streamFiles && !e2.file.dir;
          if (t2) {
            var r2 = n(e2, t2, false, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
            this.push({ data: r2.fileRecord, meta: { percent: 0 } });
          } else
            this.accumulate = true;
        }, s.prototype.closedSource = function(e2) {
          this.accumulate = false;
          var t2 = this.streamFiles && !e2.file.dir, r2 = n(e2, t2, true, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
          if (this.dirRecords.push(r2.dirRecord), t2)
            this.push({ data: function(e3) {
              return R.DATA_DESCRIPTOR + A(e3.crc32, 4) + A(e3.compressedSize, 4) + A(e3.uncompressedSize, 4);
            }(e2), meta: { percent: 100 } });
          else
            for (this.push({ data: r2.fileRecord, meta: { percent: 0 } }); this.contentBuffer.length; )
              this.push(this.contentBuffer.shift());
          this.currentFile = null;
        }, s.prototype.flush = function() {
          for (var e2 = this.bytesWritten, t2 = 0; t2 < this.dirRecords.length; t2++)
            this.push({ data: this.dirRecords[t2], meta: { percent: 100 } });
          var r2 = this.bytesWritten - e2, n2 = function(e3, t3, r3, n3, i2) {
            var s2 = I.transformTo("string", i2(n3));
            return R.CENTRAL_DIRECTORY_END + "\0\0\0\0" + A(e3, 2) + A(e3, 2) + A(t3, 4) + A(r3, 4) + A(s2.length, 2) + s2;
          }(this.dirRecords.length, r2, e2, this.zipComment, this.encodeFileName);
          this.push({ data: n2, meta: { percent: 100 } });
        }, s.prototype.prepareNextSource = function() {
          this.previous = this._sources.shift(), this.openedSource(this.previous.streamInfo), this.isPaused ? this.previous.pause() : this.previous.resume();
        }, s.prototype.registerPrevious = function(e2) {
          this._sources.push(e2);
          var t2 = this;
          return e2.on("data", function(e3) {
            t2.processChunk(e3);
          }), e2.on("end", function() {
            t2.closedSource(t2.previous.streamInfo), t2._sources.length ? t2.prepareNextSource() : t2.end();
          }), e2.on("error", function(e3) {
            t2.error(e3);
          }), this;
        }, s.prototype.resume = function() {
          return !!i.prototype.resume.call(this) && (!this.previous && this._sources.length ? (this.prepareNextSource(), true) : this.previous || this._sources.length || this.generatedError ? void 0 : (this.end(), true));
        }, s.prototype.error = function(e2) {
          var t2 = this._sources;
          if (!i.prototype.error.call(this, e2))
            return false;
          for (var r2 = 0; r2 < t2.length; r2++)
            try {
              t2[r2].error(e2);
            } catch (e3) {
            }
          return true;
        }, s.prototype.lock = function() {
          i.prototype.lock.call(this);
          for (var e2 = this._sources, t2 = 0; t2 < e2.length; t2++)
            e2[t2].lock();
        }, t.exports = s;
      }, { "../crc32": 4, "../signature": 23, "../stream/GenericWorker": 28, "../utf8": 31, "../utils": 32 }], 9: [function(e, t, r) {
        var u = e("../compressions"), n = e("./ZipFileWorker");
        r.generateWorker = function(e2, a, t2) {
          var o = new n(a.streamFiles, t2, a.platform, a.encodeFileName), h = 0;
          try {
            e2.forEach(function(e3, t3) {
              h++;
              var r2 = function(e4, t4) {
                var r3 = e4 || t4, n3 = u[r3];
                if (!n3)
                  throw new Error(r3 + " is not a valid compression method !");
                return n3;
              }(t3.options.compression, a.compression), n2 = t3.options.compressionOptions || a.compressionOptions || {}, i = t3.dir, s = t3.date;
              t3._compressWorker(r2, n2).withStreamInfo("file", { name: e3, dir: i, date: s, comment: t3.comment || "", unixPermissions: t3.unixPermissions, dosPermissions: t3.dosPermissions }).pipe(o);
            }), o.entriesCount = h;
          } catch (e3) {
            o.error(e3);
          }
          return o;
        };
      }, { "../compressions": 3, "./ZipFileWorker": 8 }], 10: [function(e, t, r) {
        function n() {
          if (!(this instanceof n))
            return new n();
          if (arguments.length)
            throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");
          this.files = /* @__PURE__ */ Object.create(null), this.comment = null, this.root = "", this.clone = function() {
            var e2 = new n();
            for (var t2 in this)
              "function" != typeof this[t2] && (e2[t2] = this[t2]);
            return e2;
          };
        }
        (n.prototype = e("./object")).loadAsync = e("./load"), n.support = e("./support"), n.defaults = e("./defaults"), n.version = "3.10.0", n.loadAsync = function(e2, t2) {
          return new n().loadAsync(e2, t2);
        }, n.external = e("./external"), t.exports = n;
      }, { "./defaults": 5, "./external": 6, "./load": 11, "./object": 15, "./support": 30 }], 11: [function(e, t, r) {
        var u = e("./utils"), i = e("./external"), n = e("./utf8"), s = e("./zipEntries"), a = e("./stream/Crc32Probe"), l = e("./nodejsUtils");
        function f(n2) {
          return new i.Promise(function(e2, t2) {
            var r2 = n2.decompressed.getContentWorker().pipe(new a());
            r2.on("error", function(e3) {
              t2(e3);
            }).on("end", function() {
              r2.streamInfo.crc32 !== n2.decompressed.crc32 ? t2(new Error("Corrupted zip : CRC32 mismatch")) : e2();
            }).resume();
          });
        }
        t.exports = function(e2, o) {
          var h = this;
          return o = u.extend(o || {}, { base64: false, checkCRC32: false, optimizedBinaryString: false, createFolders: false, decodeFileName: n.utf8decode }), l.isNode && l.isStream(e2) ? i.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")) : u.prepareContent("the loaded zip file", e2, true, o.optimizedBinaryString, o.base64).then(function(e3) {
            var t2 = new s(o);
            return t2.load(e3), t2;
          }).then(function(e3) {
            var t2 = [i.Promise.resolve(e3)], r2 = e3.files;
            if (o.checkCRC32)
              for (var n2 = 0; n2 < r2.length; n2++)
                t2.push(f(r2[n2]));
            return i.Promise.all(t2);
          }).then(function(e3) {
            for (var t2 = e3.shift(), r2 = t2.files, n2 = 0; n2 < r2.length; n2++) {
              var i2 = r2[n2], s2 = i2.fileNameStr, a2 = u.resolve(i2.fileNameStr);
              h.file(a2, i2.decompressed, { binary: true, optimizedBinaryString: true, date: i2.date, dir: i2.dir, comment: i2.fileCommentStr.length ? i2.fileCommentStr : null, unixPermissions: i2.unixPermissions, dosPermissions: i2.dosPermissions, createFolders: o.createFolders }), i2.dir || (h.file(a2).unsafeOriginalName = s2);
            }
            return t2.zipComment.length && (h.comment = t2.zipComment), h;
          });
        };
      }, { "./external": 6, "./nodejsUtils": 14, "./stream/Crc32Probe": 25, "./utf8": 31, "./utils": 32, "./zipEntries": 33 }], 12: [function(e, t, r) {
        var n = e("../utils"), i = e("../stream/GenericWorker");
        function s(e2, t2) {
          i.call(this, "Nodejs stream input adapter for " + e2), this._upstreamEnded = false, this._bindStream(t2);
        }
        n.inherits(s, i), s.prototype._bindStream = function(e2) {
          var t2 = this;
          (this._stream = e2).pause(), e2.on("data", function(e3) {
            t2.push({ data: e3, meta: { percent: 0 } });
          }).on("error", function(e3) {
            t2.isPaused ? this.generatedError = e3 : t2.error(e3);
          }).on("end", function() {
            t2.isPaused ? t2._upstreamEnded = true : t2.end();
          });
        }, s.prototype.pause = function() {
          return !!i.prototype.pause.call(this) && (this._stream.pause(), true);
        }, s.prototype.resume = function() {
          return !!i.prototype.resume.call(this) && (this._upstreamEnded ? this.end() : this._stream.resume(), true);
        }, t.exports = s;
      }, { "../stream/GenericWorker": 28, "../utils": 32 }], 13: [function(e, t, r) {
        var i = e("readable-stream").Readable;
        function n(e2, t2, r2) {
          i.call(this, t2), this._helper = e2;
          var n2 = this;
          e2.on("data", function(e3, t3) {
            n2.push(e3) || n2._helper.pause(), r2 && r2(t3);
          }).on("error", function(e3) {
            n2.emit("error", e3);
          }).on("end", function() {
            n2.push(null);
          });
        }
        e("../utils").inherits(n, i), n.prototype._read = function() {
          this._helper.resume();
        }, t.exports = n;
      }, { "../utils": 32, "readable-stream": 16 }], 14: [function(e, t, r) {
        t.exports = { isNode: "undefined" != typeof Buffer, newBufferFrom: function(e2, t2) {
          if (Buffer.from && Buffer.from !== Uint8Array.from)
            return Buffer.from(e2, t2);
          if ("number" == typeof e2)
            throw new Error('The "data" argument must not be a number');
          return new Buffer(e2, t2);
        }, allocBuffer: function(e2) {
          if (Buffer.alloc)
            return Buffer.alloc(e2);
          var t2 = new Buffer(e2);
          return t2.fill(0), t2;
        }, isBuffer: function(e2) {
          return Buffer.isBuffer(e2);
        }, isStream: function(e2) {
          return e2 && "function" == typeof e2.on && "function" == typeof e2.pause && "function" == typeof e2.resume;
        } };
      }, {}], 15: [function(e, t, r) {
        function s(e2, t2, r2) {
          var n2, i2 = u.getTypeOf(t2), s2 = u.extend(r2 || {}, f);
          s2.date = s2.date || new Date(), null !== s2.compression && (s2.compression = s2.compression.toUpperCase()), "string" == typeof s2.unixPermissions && (s2.unixPermissions = parseInt(s2.unixPermissions, 8)), s2.unixPermissions && 16384 & s2.unixPermissions && (s2.dir = true), s2.dosPermissions && 16 & s2.dosPermissions && (s2.dir = true), s2.dir && (e2 = g(e2)), s2.createFolders && (n2 = _2(e2)) && b.call(this, n2, true);
          var a2 = "string" === i2 && false === s2.binary && false === s2.base64;
          r2 && void 0 !== r2.binary || (s2.binary = !a2), (t2 instanceof c && 0 === t2.uncompressedSize || s2.dir || !t2 || 0 === t2.length) && (s2.base64 = false, s2.binary = true, t2 = "", s2.compression = "STORE", i2 = "string");
          var o2 = null;
          o2 = t2 instanceof c || t2 instanceof l ? t2 : p.isNode && p.isStream(t2) ? new m(e2, t2) : u.prepareContent(e2, t2, s2.binary, s2.optimizedBinaryString, s2.base64);
          var h2 = new d(e2, o2, s2);
          this.files[e2] = h2;
        }
        var i = e("./utf8"), u = e("./utils"), l = e("./stream/GenericWorker"), a = e("./stream/StreamHelper"), f = e("./defaults"), c = e("./compressedObject"), d = e("./zipObject"), o = e("./generate"), p = e("./nodejsUtils"), m = e("./nodejs/NodejsStreamInputAdapter"), _2 = function(e2) {
          "/" === e2.slice(-1) && (e2 = e2.substring(0, e2.length - 1));
          var t2 = e2.lastIndexOf("/");
          return 0 < t2 ? e2.substring(0, t2) : "";
        }, g = function(e2) {
          return "/" !== e2.slice(-1) && (e2 += "/"), e2;
        }, b = function(e2, t2) {
          return t2 = void 0 !== t2 ? t2 : f.createFolders, e2 = g(e2), this.files[e2] || s.call(this, e2, null, { dir: true, createFolders: t2 }), this.files[e2];
        };
        function h(e2) {
          return "[object RegExp]" === Object.prototype.toString.call(e2);
        }
        var n = { load: function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, forEach: function(e2) {
          var t2, r2, n2;
          for (t2 in this.files)
            n2 = this.files[t2], (r2 = t2.slice(this.root.length, t2.length)) && t2.slice(0, this.root.length) === this.root && e2(r2, n2);
        }, filter: function(r2) {
          var n2 = [];
          return this.forEach(function(e2, t2) {
            r2(e2, t2) && n2.push(t2);
          }), n2;
        }, file: function(e2, t2, r2) {
          if (1 !== arguments.length)
            return e2 = this.root + e2, s.call(this, e2, t2, r2), this;
          if (h(e2)) {
            var n2 = e2;
            return this.filter(function(e3, t3) {
              return !t3.dir && n2.test(e3);
            });
          }
          var i2 = this.files[this.root + e2];
          return i2 && !i2.dir ? i2 : null;
        }, folder: function(r2) {
          if (!r2)
            return this;
          if (h(r2))
            return this.filter(function(e3, t3) {
              return t3.dir && r2.test(e3);
            });
          var e2 = this.root + r2, t2 = b.call(this, e2), n2 = this.clone();
          return n2.root = t2.name, n2;
        }, remove: function(r2) {
          r2 = this.root + r2;
          var e2 = this.files[r2];
          if (e2 || ("/" !== r2.slice(-1) && (r2 += "/"), e2 = this.files[r2]), e2 && !e2.dir)
            delete this.files[r2];
          else
            for (var t2 = this.filter(function(e3, t3) {
              return t3.name.slice(0, r2.length) === r2;
            }), n2 = 0; n2 < t2.length; n2++)
              delete this.files[t2[n2].name];
          return this;
        }, generate: function(e2) {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, generateInternalStream: function(e2) {
          var t2, r2 = {};
          try {
            if ((r2 = u.extend(e2 || {}, { streamFiles: false, compression: "STORE", compressionOptions: null, type: "", platform: "DOS", comment: null, mimeType: "application/zip", encodeFileName: i.utf8encode })).type = r2.type.toLowerCase(), r2.compression = r2.compression.toUpperCase(), "binarystring" === r2.type && (r2.type = "string"), !r2.type)
              throw new Error("No output type specified.");
            u.checkSupport(r2.type), "darwin" !== r2.platform && "freebsd" !== r2.platform && "linux" !== r2.platform && "sunos" !== r2.platform || (r2.platform = "UNIX"), "win32" === r2.platform && (r2.platform = "DOS");
            var n2 = r2.comment || this.comment || "";
            t2 = o.generateWorker(this, r2, n2);
          } catch (e3) {
            (t2 = new l("error")).error(e3);
          }
          return new a(t2, r2.type || "string", r2.mimeType);
        }, generateAsync: function(e2, t2) {
          return this.generateInternalStream(e2).accumulate(t2);
        }, generateNodeStream: function(e2, t2) {
          return (e2 = e2 || {}).type || (e2.type = "nodebuffer"), this.generateInternalStream(e2).toNodejsStream(t2);
        } };
        t.exports = n;
      }, { "./compressedObject": 2, "./defaults": 5, "./generate": 9, "./nodejs/NodejsStreamInputAdapter": 12, "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31, "./utils": 32, "./zipObject": 35 }], 16: [function(e, t, r) {
        t.exports = e("stream");
      }, { stream: void 0 }], 17: [function(e, t, r) {
        var n = e("./DataReader");
        function i(e2) {
          n.call(this, e2);
          for (var t2 = 0; t2 < this.data.length; t2++)
            e2[t2] = 255 & e2[t2];
        }
        e("../utils").inherits(i, n), i.prototype.byteAt = function(e2) {
          return this.data[this.zero + e2];
        }, i.prototype.lastIndexOfSignature = function(e2) {
          for (var t2 = e2.charCodeAt(0), r2 = e2.charCodeAt(1), n2 = e2.charCodeAt(2), i2 = e2.charCodeAt(3), s = this.length - 4; 0 <= s; --s)
            if (this.data[s] === t2 && this.data[s + 1] === r2 && this.data[s + 2] === n2 && this.data[s + 3] === i2)
              return s - this.zero;
          return -1;
        }, i.prototype.readAndCheckSignature = function(e2) {
          var t2 = e2.charCodeAt(0), r2 = e2.charCodeAt(1), n2 = e2.charCodeAt(2), i2 = e2.charCodeAt(3), s = this.readData(4);
          return t2 === s[0] && r2 === s[1] && n2 === s[2] && i2 === s[3];
        }, i.prototype.readData = function(e2) {
          if (this.checkOffset(e2), 0 === e2)
            return [];
          var t2 = this.data.slice(this.zero + this.index, this.zero + this.index + e2);
          return this.index += e2, t2;
        }, t.exports = i;
      }, { "../utils": 32, "./DataReader": 18 }], 18: [function(e, t, r) {
        var n = e("../utils");
        function i(e2) {
          this.data = e2, this.length = e2.length, this.index = 0, this.zero = 0;
        }
        i.prototype = { checkOffset: function(e2) {
          this.checkIndex(this.index + e2);
        }, checkIndex: function(e2) {
          if (this.length < this.zero + e2 || e2 < 0)
            throw new Error("End of data reached (data length = " + this.length + ", asked index = " + e2 + "). Corrupted zip ?");
        }, setIndex: function(e2) {
          this.checkIndex(e2), this.index = e2;
        }, skip: function(e2) {
          this.setIndex(this.index + e2);
        }, byteAt: function(e2) {
        }, readInt: function(e2) {
          var t2, r2 = 0;
          for (this.checkOffset(e2), t2 = this.index + e2 - 1; t2 >= this.index; t2--)
            r2 = (r2 << 8) + this.byteAt(t2);
          return this.index += e2, r2;
        }, readString: function(e2) {
          return n.transformTo("string", this.readData(e2));
        }, readData: function(e2) {
        }, lastIndexOfSignature: function(e2) {
        }, readAndCheckSignature: function(e2) {
        }, readDate: function() {
          var e2 = this.readInt(4);
          return new Date(Date.UTC(1980 + (e2 >> 25 & 127), (e2 >> 21 & 15) - 1, e2 >> 16 & 31, e2 >> 11 & 31, e2 >> 5 & 63, (31 & e2) << 1));
        } }, t.exports = i;
      }, { "../utils": 32 }], 19: [function(e, t, r) {
        var n = e("./Uint8ArrayReader");
        function i(e2) {
          n.call(this, e2);
        }
        e("../utils").inherits(i, n), i.prototype.readData = function(e2) {
          this.checkOffset(e2);
          var t2 = this.data.slice(this.zero + this.index, this.zero + this.index + e2);
          return this.index += e2, t2;
        }, t.exports = i;
      }, { "../utils": 32, "./Uint8ArrayReader": 21 }], 20: [function(e, t, r) {
        var n = e("./DataReader");
        function i(e2) {
          n.call(this, e2);
        }
        e("../utils").inherits(i, n), i.prototype.byteAt = function(e2) {
          return this.data.charCodeAt(this.zero + e2);
        }, i.prototype.lastIndexOfSignature = function(e2) {
          return this.data.lastIndexOf(e2) - this.zero;
        }, i.prototype.readAndCheckSignature = function(e2) {
          return e2 === this.readData(4);
        }, i.prototype.readData = function(e2) {
          this.checkOffset(e2);
          var t2 = this.data.slice(this.zero + this.index, this.zero + this.index + e2);
          return this.index += e2, t2;
        }, t.exports = i;
      }, { "../utils": 32, "./DataReader": 18 }], 21: [function(e, t, r) {
        var n = e("./ArrayReader");
        function i(e2) {
          n.call(this, e2);
        }
        e("../utils").inherits(i, n), i.prototype.readData = function(e2) {
          if (this.checkOffset(e2), 0 === e2)
            return new Uint8Array(0);
          var t2 = this.data.subarray(this.zero + this.index, this.zero + this.index + e2);
          return this.index += e2, t2;
        }, t.exports = i;
      }, { "../utils": 32, "./ArrayReader": 17 }], 22: [function(e, t, r) {
        var n = e("../utils"), i = e("../support"), s = e("./ArrayReader"), a = e("./StringReader"), o = e("./NodeBufferReader"), h = e("./Uint8ArrayReader");
        t.exports = function(e2) {
          var t2 = n.getTypeOf(e2);
          return n.checkSupport(t2), "string" !== t2 || i.uint8array ? "nodebuffer" === t2 ? new o(e2) : i.uint8array ? new h(n.transformTo("uint8array", e2)) : new s(n.transformTo("array", e2)) : new a(e2);
        };
      }, { "../support": 30, "../utils": 32, "./ArrayReader": 17, "./NodeBufferReader": 19, "./StringReader": 20, "./Uint8ArrayReader": 21 }], 23: [function(e, t, r) {
        r.LOCAL_FILE_HEADER = "PK", r.CENTRAL_FILE_HEADER = "PK", r.CENTRAL_DIRECTORY_END = "PK", r.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x07", r.ZIP64_CENTRAL_DIRECTORY_END = "PK", r.DATA_DESCRIPTOR = "PK\x07\b";
      }, {}], 24: [function(e, t, r) {
        var n = e("./GenericWorker"), i = e("../utils");
        function s(e2) {
          n.call(this, "ConvertWorker to " + e2), this.destType = e2;
        }
        i.inherits(s, n), s.prototype.processChunk = function(e2) {
          this.push({ data: i.transformTo(this.destType, e2.data), meta: e2.meta });
        }, t.exports = s;
      }, { "../utils": 32, "./GenericWorker": 28 }], 25: [function(e, t, r) {
        var n = e("./GenericWorker"), i = e("../crc32");
        function s() {
          n.call(this, "Crc32Probe"), this.withStreamInfo("crc32", 0);
        }
        e("../utils").inherits(s, n), s.prototype.processChunk = function(e2) {
          this.streamInfo.crc32 = i(e2.data, this.streamInfo.crc32 || 0), this.push(e2);
        }, t.exports = s;
      }, { "../crc32": 4, "../utils": 32, "./GenericWorker": 28 }], 26: [function(e, t, r) {
        var n = e("../utils"), i = e("./GenericWorker");
        function s(e2) {
          i.call(this, "DataLengthProbe for " + e2), this.propName = e2, this.withStreamInfo(e2, 0);
        }
        n.inherits(s, i), s.prototype.processChunk = function(e2) {
          if (e2) {
            var t2 = this.streamInfo[this.propName] || 0;
            this.streamInfo[this.propName] = t2 + e2.data.length;
          }
          i.prototype.processChunk.call(this, e2);
        }, t.exports = s;
      }, { "../utils": 32, "./GenericWorker": 28 }], 27: [function(e, t, r) {
        var n = e("../utils"), i = e("./GenericWorker");
        function s(e2) {
          i.call(this, "DataWorker");
          var t2 = this;
          this.dataIsReady = false, this.index = 0, this.max = 0, this.data = null, this.type = "", this._tickScheduled = false, e2.then(function(e3) {
            t2.dataIsReady = true, t2.data = e3, t2.max = e3 && e3.length || 0, t2.type = n.getTypeOf(e3), t2.isPaused || t2._tickAndRepeat();
          }, function(e3) {
            t2.error(e3);
          });
        }
        n.inherits(s, i), s.prototype.cleanUp = function() {
          i.prototype.cleanUp.call(this), this.data = null;
        }, s.prototype.resume = function() {
          return !!i.prototype.resume.call(this) && (!this._tickScheduled && this.dataIsReady && (this._tickScheduled = true, n.delay(this._tickAndRepeat, [], this)), true);
        }, s.prototype._tickAndRepeat = function() {
          this._tickScheduled = false, this.isPaused || this.isFinished || (this._tick(), this.isFinished || (n.delay(this._tickAndRepeat, [], this), this._tickScheduled = true));
        }, s.prototype._tick = function() {
          if (this.isPaused || this.isFinished)
            return false;
          var e2 = null, t2 = Math.min(this.max, this.index + 16384);
          if (this.index >= this.max)
            return this.end();
          switch (this.type) {
            case "string":
              e2 = this.data.substring(this.index, t2);
              break;
            case "uint8array":
              e2 = this.data.subarray(this.index, t2);
              break;
            case "array":
            case "nodebuffer":
              e2 = this.data.slice(this.index, t2);
          }
          return this.index = t2, this.push({ data: e2, meta: { percent: this.max ? this.index / this.max * 100 : 0 } });
        }, t.exports = s;
      }, { "../utils": 32, "./GenericWorker": 28 }], 28: [function(e, t, r) {
        function n(e2) {
          this.name = e2 || "default", this.streamInfo = {}, this.generatedError = null, this.extraStreamInfo = {}, this.isPaused = true, this.isFinished = false, this.isLocked = false, this._listeners = { data: [], end: [], error: [] }, this.previous = null;
        }
        n.prototype = { push: function(e2) {
          this.emit("data", e2);
        }, end: function() {
          if (this.isFinished)
            return false;
          this.flush();
          try {
            this.emit("end"), this.cleanUp(), this.isFinished = true;
          } catch (e2) {
            this.emit("error", e2);
          }
          return true;
        }, error: function(e2) {
          return !this.isFinished && (this.isPaused ? this.generatedError = e2 : (this.isFinished = true, this.emit("error", e2), this.previous && this.previous.error(e2), this.cleanUp()), true);
        }, on: function(e2, t2) {
          return this._listeners[e2].push(t2), this;
        }, cleanUp: function() {
          this.streamInfo = this.generatedError = this.extraStreamInfo = null, this._listeners = [];
        }, emit: function(e2, t2) {
          if (this._listeners[e2])
            for (var r2 = 0; r2 < this._listeners[e2].length; r2++)
              this._listeners[e2][r2].call(this, t2);
        }, pipe: function(e2) {
          return e2.registerPrevious(this);
        }, registerPrevious: function(e2) {
          if (this.isLocked)
            throw new Error("The stream '" + this + "' has already been used.");
          this.streamInfo = e2.streamInfo, this.mergeStreamInfo(), this.previous = e2;
          var t2 = this;
          return e2.on("data", function(e3) {
            t2.processChunk(e3);
          }), e2.on("end", function() {
            t2.end();
          }), e2.on("error", function(e3) {
            t2.error(e3);
          }), this;
        }, pause: function() {
          return !this.isPaused && !this.isFinished && (this.isPaused = true, this.previous && this.previous.pause(), true);
        }, resume: function() {
          if (!this.isPaused || this.isFinished)
            return false;
          var e2 = this.isPaused = false;
          return this.generatedError && (this.error(this.generatedError), e2 = true), this.previous && this.previous.resume(), !e2;
        }, flush: function() {
        }, processChunk: function(e2) {
          this.push(e2);
        }, withStreamInfo: function(e2, t2) {
          return this.extraStreamInfo[e2] = t2, this.mergeStreamInfo(), this;
        }, mergeStreamInfo: function() {
          for (var e2 in this.extraStreamInfo)
            this.extraStreamInfo.hasOwnProperty(e2) && (this.streamInfo[e2] = this.extraStreamInfo[e2]);
        }, lock: function() {
          if (this.isLocked)
            throw new Error("The stream '" + this + "' has already been used.");
          this.isLocked = true, this.previous && this.previous.lock();
        }, toString: function() {
          var e2 = "Worker " + this.name;
          return this.previous ? this.previous + " -> " + e2 : e2;
        } }, t.exports = n;
      }, {}], 29: [function(e, t, r) {
        var h = e("../utils"), i = e("./ConvertWorker"), s = e("./GenericWorker"), u = e("../base64"), n = e("../support"), a = e("../external"), o = null;
        if (n.nodestream)
          try {
            o = e("../nodejs/NodejsStreamOutputAdapter");
          } catch (e2) {
          }
        function l(e2, o2) {
          return new a.Promise(function(t2, r2) {
            var n2 = [], i2 = e2._internalType, s2 = e2._outputType, a2 = e2._mimeType;
            e2.on("data", function(e3, t3) {
              n2.push(e3), o2 && o2(t3);
            }).on("error", function(e3) {
              n2 = [], r2(e3);
            }).on("end", function() {
              try {
                var e3 = function(e4, t3, r3) {
                  switch (e4) {
                    case "blob":
                      return h.newBlob(h.transformTo("arraybuffer", t3), r3);
                    case "base64":
                      return u.encode(t3);
                    default:
                      return h.transformTo(e4, t3);
                  }
                }(s2, function(e4, t3) {
                  var r3, n3 = 0, i3 = null, s3 = 0;
                  for (r3 = 0; r3 < t3.length; r3++)
                    s3 += t3[r3].length;
                  switch (e4) {
                    case "string":
                      return t3.join("");
                    case "array":
                      return Array.prototype.concat.apply([], t3);
                    case "uint8array":
                      for (i3 = new Uint8Array(s3), r3 = 0; r3 < t3.length; r3++)
                        i3.set(t3[r3], n3), n3 += t3[r3].length;
                      return i3;
                    case "nodebuffer":
                      return Buffer.concat(t3);
                    default:
                      throw new Error("concat : unsupported type '" + e4 + "'");
                  }
                }(i2, n2), a2);
                t2(e3);
              } catch (e4) {
                r2(e4);
              }
              n2 = [];
            }).resume();
          });
        }
        function f(e2, t2, r2) {
          var n2 = t2;
          switch (t2) {
            case "blob":
            case "arraybuffer":
              n2 = "uint8array";
              break;
            case "base64":
              n2 = "string";
          }
          try {
            this._internalType = n2, this._outputType = t2, this._mimeType = r2, h.checkSupport(n2), this._worker = e2.pipe(new i(n2)), e2.lock();
          } catch (e3) {
            this._worker = new s("error"), this._worker.error(e3);
          }
        }
        f.prototype = { accumulate: function(e2) {
          return l(this, e2);
        }, on: function(e2, t2) {
          var r2 = this;
          return "data" === e2 ? this._worker.on(e2, function(e3) {
            t2.call(r2, e3.data, e3.meta);
          }) : this._worker.on(e2, function() {
            h.delay(t2, arguments, r2);
          }), this;
        }, resume: function() {
          return h.delay(this._worker.resume, [], this._worker), this;
        }, pause: function() {
          return this._worker.pause(), this;
        }, toNodejsStream: function(e2) {
          if (h.checkSupport("nodestream"), "nodebuffer" !== this._outputType)
            throw new Error(this._outputType + " is not supported by this method");
          return new o(this, { objectMode: "nodebuffer" !== this._outputType }, e2);
        } }, t.exports = f;
      }, { "../base64": 1, "../external": 6, "../nodejs/NodejsStreamOutputAdapter": 13, "../support": 30, "../utils": 32, "./ConvertWorker": 24, "./GenericWorker": 28 }], 30: [function(e, t, r) {
        if (r.base64 = true, r.array = true, r.string = true, r.arraybuffer = "undefined" != typeof ArrayBuffer && "undefined" != typeof Uint8Array, r.nodebuffer = "undefined" != typeof Buffer, r.uint8array = "undefined" != typeof Uint8Array, "undefined" == typeof ArrayBuffer)
          r.blob = false;
        else {
          var n = new ArrayBuffer(0);
          try {
            r.blob = 0 === new Blob([n], { type: "application/zip" }).size;
          } catch (e2) {
            try {
              var i = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
              i.append(n), r.blob = 0 === i.getBlob("application/zip").size;
            } catch (e3) {
              r.blob = false;
            }
          }
        }
        try {
          r.nodestream = !!e("readable-stream").Readable;
        } catch (e2) {
          r.nodestream = false;
        }
      }, { "readable-stream": 16 }], 31: [function(e, t, s) {
        for (var o = e("./utils"), h = e("./support"), r = e("./nodejsUtils"), n = e("./stream/GenericWorker"), u = new Array(256), i = 0; i < 256; i++)
          u[i] = 252 <= i ? 6 : 248 <= i ? 5 : 240 <= i ? 4 : 224 <= i ? 3 : 192 <= i ? 2 : 1;
        u[254] = u[254] = 1;
        function a() {
          n.call(this, "utf-8 decode"), this.leftOver = null;
        }
        function l() {
          n.call(this, "utf-8 encode");
        }
        s.utf8encode = function(e2) {
          return h.nodebuffer ? r.newBufferFrom(e2, "utf-8") : function(e3) {
            var t2, r2, n2, i2, s2, a2 = e3.length, o2 = 0;
            for (i2 = 0; i2 < a2; i2++)
              55296 == (64512 & (r2 = e3.charCodeAt(i2))) && i2 + 1 < a2 && 56320 == (64512 & (n2 = e3.charCodeAt(i2 + 1))) && (r2 = 65536 + (r2 - 55296 << 10) + (n2 - 56320), i2++), o2 += r2 < 128 ? 1 : r2 < 2048 ? 2 : r2 < 65536 ? 3 : 4;
            for (t2 = h.uint8array ? new Uint8Array(o2) : new Array(o2), i2 = s2 = 0; s2 < o2; i2++)
              55296 == (64512 & (r2 = e3.charCodeAt(i2))) && i2 + 1 < a2 && 56320 == (64512 & (n2 = e3.charCodeAt(i2 + 1))) && (r2 = 65536 + (r2 - 55296 << 10) + (n2 - 56320), i2++), r2 < 128 ? t2[s2++] = r2 : (r2 < 2048 ? t2[s2++] = 192 | r2 >>> 6 : (r2 < 65536 ? t2[s2++] = 224 | r2 >>> 12 : (t2[s2++] = 240 | r2 >>> 18, t2[s2++] = 128 | r2 >>> 12 & 63), t2[s2++] = 128 | r2 >>> 6 & 63), t2[s2++] = 128 | 63 & r2);
            return t2;
          }(e2);
        }, s.utf8decode = function(e2) {
          return h.nodebuffer ? o.transformTo("nodebuffer", e2).toString("utf-8") : function(e3) {
            var t2, r2, n2, i2, s2 = e3.length, a2 = new Array(2 * s2);
            for (t2 = r2 = 0; t2 < s2; )
              if ((n2 = e3[t2++]) < 128)
                a2[r2++] = n2;
              else if (4 < (i2 = u[n2]))
                a2[r2++] = 65533, t2 += i2 - 1;
              else {
                for (n2 &= 2 === i2 ? 31 : 3 === i2 ? 15 : 7; 1 < i2 && t2 < s2; )
                  n2 = n2 << 6 | 63 & e3[t2++], i2--;
                1 < i2 ? a2[r2++] = 65533 : n2 < 65536 ? a2[r2++] = n2 : (n2 -= 65536, a2[r2++] = 55296 | n2 >> 10 & 1023, a2[r2++] = 56320 | 1023 & n2);
              }
            return a2.length !== r2 && (a2.subarray ? a2 = a2.subarray(0, r2) : a2.length = r2), o.applyFromCharCode(a2);
          }(e2 = o.transformTo(h.uint8array ? "uint8array" : "array", e2));
        }, o.inherits(a, n), a.prototype.processChunk = function(e2) {
          var t2 = o.transformTo(h.uint8array ? "uint8array" : "array", e2.data);
          if (this.leftOver && this.leftOver.length) {
            if (h.uint8array) {
              var r2 = t2;
              (t2 = new Uint8Array(r2.length + this.leftOver.length)).set(this.leftOver, 0), t2.set(r2, this.leftOver.length);
            } else
              t2 = this.leftOver.concat(t2);
            this.leftOver = null;
          }
          var n2 = function(e3, t3) {
            var r3;
            for ((t3 = t3 || e3.length) > e3.length && (t3 = e3.length), r3 = t3 - 1; 0 <= r3 && 128 == (192 & e3[r3]); )
              r3--;
            return r3 < 0 ? t3 : 0 === r3 ? t3 : r3 + u[e3[r3]] > t3 ? r3 : t3;
          }(t2), i2 = t2;
          n2 !== t2.length && (h.uint8array ? (i2 = t2.subarray(0, n2), this.leftOver = t2.subarray(n2, t2.length)) : (i2 = t2.slice(0, n2), this.leftOver = t2.slice(n2, t2.length))), this.push({ data: s.utf8decode(i2), meta: e2.meta });
        }, a.prototype.flush = function() {
          this.leftOver && this.leftOver.length && (this.push({ data: s.utf8decode(this.leftOver), meta: {} }), this.leftOver = null);
        }, s.Utf8DecodeWorker = a, o.inherits(l, n), l.prototype.processChunk = function(e2) {
          this.push({ data: s.utf8encode(e2.data), meta: e2.meta });
        }, s.Utf8EncodeWorker = l;
      }, { "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./support": 30, "./utils": 32 }], 32: [function(e, t, a) {
        var o = e("./support"), h = e("./base64"), r = e("./nodejsUtils"), u = e("./external");
        function n(e2) {
          return e2;
        }
        function l(e2, t2) {
          for (var r2 = 0; r2 < e2.length; ++r2)
            t2[r2] = 255 & e2.charCodeAt(r2);
          return t2;
        }
        e("setimmediate"), a.newBlob = function(t2, r2) {
          a.checkSupport("blob");
          try {
            return new Blob([t2], { type: r2 });
          } catch (e2) {
            try {
              var n2 = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
              return n2.append(t2), n2.getBlob(r2);
            } catch (e3) {
              throw new Error("Bug : can't construct the Blob.");
            }
          }
        };
        var i = { stringifyByChunk: function(e2, t2, r2) {
          var n2 = [], i2 = 0, s2 = e2.length;
          if (s2 <= r2)
            return String.fromCharCode.apply(null, e2);
          for (; i2 < s2; )
            "array" === t2 || "nodebuffer" === t2 ? n2.push(String.fromCharCode.apply(null, e2.slice(i2, Math.min(i2 + r2, s2)))) : n2.push(String.fromCharCode.apply(null, e2.subarray(i2, Math.min(i2 + r2, s2)))), i2 += r2;
          return n2.join("");
        }, stringifyByChar: function(e2) {
          for (var t2 = "", r2 = 0; r2 < e2.length; r2++)
            t2 += String.fromCharCode(e2[r2]);
          return t2;
        }, applyCanBeUsed: { uint8array: function() {
          try {
            return o.uint8array && 1 === String.fromCharCode.apply(null, new Uint8Array(1)).length;
          } catch (e2) {
            return false;
          }
        }(), nodebuffer: function() {
          try {
            return o.nodebuffer && 1 === String.fromCharCode.apply(null, r.allocBuffer(1)).length;
          } catch (e2) {
            return false;
          }
        }() } };
        function s(e2) {
          var t2 = 65536, r2 = a.getTypeOf(e2), n2 = true;
          if ("uint8array" === r2 ? n2 = i.applyCanBeUsed.uint8array : "nodebuffer" === r2 && (n2 = i.applyCanBeUsed.nodebuffer), n2)
            for (; 1 < t2; )
              try {
                return i.stringifyByChunk(e2, r2, t2);
              } catch (e3) {
                t2 = Math.floor(t2 / 2);
              }
          return i.stringifyByChar(e2);
        }
        function f(e2, t2) {
          for (var r2 = 0; r2 < e2.length; r2++)
            t2[r2] = e2[r2];
          return t2;
        }
        a.applyFromCharCode = s;
        var c = {};
        c.string = { string: n, array: function(e2) {
          return l(e2, new Array(e2.length));
        }, arraybuffer: function(e2) {
          return c.string.uint8array(e2).buffer;
        }, uint8array: function(e2) {
          return l(e2, new Uint8Array(e2.length));
        }, nodebuffer: function(e2) {
          return l(e2, r.allocBuffer(e2.length));
        } }, c.array = { string: s, array: n, arraybuffer: function(e2) {
          return new Uint8Array(e2).buffer;
        }, uint8array: function(e2) {
          return new Uint8Array(e2);
        }, nodebuffer: function(e2) {
          return r.newBufferFrom(e2);
        } }, c.arraybuffer = { string: function(e2) {
          return s(new Uint8Array(e2));
        }, array: function(e2) {
          return f(new Uint8Array(e2), new Array(e2.byteLength));
        }, arraybuffer: n, uint8array: function(e2) {
          return new Uint8Array(e2);
        }, nodebuffer: function(e2) {
          return r.newBufferFrom(new Uint8Array(e2));
        } }, c.uint8array = { string: s, array: function(e2) {
          return f(e2, new Array(e2.length));
        }, arraybuffer: function(e2) {
          return e2.buffer;
        }, uint8array: n, nodebuffer: function(e2) {
          return r.newBufferFrom(e2);
        } }, c.nodebuffer = { string: s, array: function(e2) {
          return f(e2, new Array(e2.length));
        }, arraybuffer: function(e2) {
          return c.nodebuffer.uint8array(e2).buffer;
        }, uint8array: function(e2) {
          return f(e2, new Uint8Array(e2.length));
        }, nodebuffer: n }, a.transformTo = function(e2, t2) {
          if (t2 = t2 || "", !e2)
            return t2;
          a.checkSupport(e2);
          var r2 = a.getTypeOf(t2);
          return c[r2][e2](t2);
        }, a.resolve = function(e2) {
          for (var t2 = e2.split("/"), r2 = [], n2 = 0; n2 < t2.length; n2++) {
            var i2 = t2[n2];
            "." === i2 || "" === i2 && 0 !== n2 && n2 !== t2.length - 1 || (".." === i2 ? r2.pop() : r2.push(i2));
          }
          return r2.join("/");
        }, a.getTypeOf = function(e2) {
          return "string" == typeof e2 ? "string" : "[object Array]" === Object.prototype.toString.call(e2) ? "array" : o.nodebuffer && r.isBuffer(e2) ? "nodebuffer" : o.uint8array && e2 instanceof Uint8Array ? "uint8array" : o.arraybuffer && e2 instanceof ArrayBuffer ? "arraybuffer" : void 0;
        }, a.checkSupport = function(e2) {
          if (!o[e2.toLowerCase()])
            throw new Error(e2 + " is not supported by this platform");
        }, a.MAX_VALUE_16BITS = 65535, a.MAX_VALUE_32BITS = -1, a.pretty = function(e2) {
          var t2, r2, n2 = "";
          for (r2 = 0; r2 < (e2 || "").length; r2++)
            n2 += "\\x" + ((t2 = e2.charCodeAt(r2)) < 16 ? "0" : "") + t2.toString(16).toUpperCase();
          return n2;
        }, a.delay = function(e2, t2, r2) {
          setImmediate(function() {
            e2.apply(r2 || null, t2 || []);
          });
        }, a.inherits = function(e2, t2) {
          function r2() {
          }
          r2.prototype = t2.prototype, e2.prototype = new r2();
        }, a.extend = function() {
          var e2, t2, r2 = {};
          for (e2 = 0; e2 < arguments.length; e2++)
            for (t2 in arguments[e2])
              arguments[e2].hasOwnProperty(t2) && void 0 === r2[t2] && (r2[t2] = arguments[e2][t2]);
          return r2;
        }, a.prepareContent = function(r2, e2, n2, i2, s2) {
          return u.Promise.resolve(e2).then(function(n3) {
            return o.blob && (n3 instanceof Blob || -1 !== ["[object File]", "[object Blob]"].indexOf(Object.prototype.toString.call(n3))) && "undefined" != typeof FileReader ? new u.Promise(function(t2, r3) {
              var e3 = new FileReader();
              e3.onload = function(e4) {
                t2(e4.target.result);
              }, e3.onerror = function(e4) {
                r3(e4.target.error);
              }, e3.readAsArrayBuffer(n3);
            }) : n3;
          }).then(function(e3) {
            var t2 = a.getTypeOf(e3);
            return t2 ? ("arraybuffer" === t2 ? e3 = a.transformTo("uint8array", e3) : "string" === t2 && (s2 ? e3 = h.decode(e3) : n2 && true !== i2 && (e3 = function(e4) {
              return l(e4, o.uint8array ? new Uint8Array(e4.length) : new Array(e4.length));
            }(e3))), e3) : u.Promise.reject(new Error("Can't read the data of '" + r2 + "'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"));
          });
        };
      }, { "./base64": 1, "./external": 6, "./nodejsUtils": 14, "./support": 30, setimmediate: 54 }], 33: [function(e, t, r) {
        var n = e("./reader/readerFor"), i = e("./utils"), s = e("./signature"), a = e("./zipEntry"), o = (e("./utf8"), e("./support"));
        function h(e2) {
          this.files = [], this.loadOptions = e2;
        }
        h.prototype = { checkSignature: function(e2) {
          if (!this.reader.readAndCheckSignature(e2)) {
            this.reader.index -= 4;
            var t2 = this.reader.readString(4);
            throw new Error("Corrupted zip or bug: unexpected signature (" + i.pretty(t2) + ", expected " + i.pretty(e2) + ")");
          }
        }, isSignature: function(e2, t2) {
          var r2 = this.reader.index;
          this.reader.setIndex(e2);
          var n2 = this.reader.readString(4) === t2;
          return this.reader.setIndex(r2), n2;
        }, readBlockEndOfCentral: function() {
          this.diskNumber = this.reader.readInt(2), this.diskWithCentralDirStart = this.reader.readInt(2), this.centralDirRecordsOnThisDisk = this.reader.readInt(2), this.centralDirRecords = this.reader.readInt(2), this.centralDirSize = this.reader.readInt(4), this.centralDirOffset = this.reader.readInt(4), this.zipCommentLength = this.reader.readInt(2);
          var e2 = this.reader.readData(this.zipCommentLength), t2 = o.uint8array ? "uint8array" : "array", r2 = i.transformTo(t2, e2);
          this.zipComment = this.loadOptions.decodeFileName(r2);
        }, readBlockZip64EndOfCentral: function() {
          this.zip64EndOfCentralSize = this.reader.readInt(8), this.reader.skip(4), this.diskNumber = this.reader.readInt(4), this.diskWithCentralDirStart = this.reader.readInt(4), this.centralDirRecordsOnThisDisk = this.reader.readInt(8), this.centralDirRecords = this.reader.readInt(8), this.centralDirSize = this.reader.readInt(8), this.centralDirOffset = this.reader.readInt(8), this.zip64ExtensibleData = {};
          for (var e2, t2, r2, n2 = this.zip64EndOfCentralSize - 44; 0 < n2; )
            e2 = this.reader.readInt(2), t2 = this.reader.readInt(4), r2 = this.reader.readData(t2), this.zip64ExtensibleData[e2] = { id: e2, length: t2, value: r2 };
        }, readBlockZip64EndOfCentralLocator: function() {
          if (this.diskWithZip64CentralDirStart = this.reader.readInt(4), this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8), this.disksCount = this.reader.readInt(4), 1 < this.disksCount)
            throw new Error("Multi-volumes zip are not supported");
        }, readLocalFiles: function() {
          var e2, t2;
          for (e2 = 0; e2 < this.files.length; e2++)
            t2 = this.files[e2], this.reader.setIndex(t2.localHeaderOffset), this.checkSignature(s.LOCAL_FILE_HEADER), t2.readLocalPart(this.reader), t2.handleUTF8(), t2.processAttributes();
        }, readCentralDir: function() {
          var e2;
          for (this.reader.setIndex(this.centralDirOffset); this.reader.readAndCheckSignature(s.CENTRAL_FILE_HEADER); )
            (e2 = new a({ zip64: this.zip64 }, this.loadOptions)).readCentralPart(this.reader), this.files.push(e2);
          if (this.centralDirRecords !== this.files.length && 0 !== this.centralDirRecords && 0 === this.files.length)
            throw new Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length);
        }, readEndOfCentral: function() {
          var e2 = this.reader.lastIndexOfSignature(s.CENTRAL_DIRECTORY_END);
          if (e2 < 0)
            throw !this.isSignature(0, s.LOCAL_FILE_HEADER) ? new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html") : new Error("Corrupted zip: can't find end of central directory");
          this.reader.setIndex(e2);
          var t2 = e2;
          if (this.checkSignature(s.CENTRAL_DIRECTORY_END), this.readBlockEndOfCentral(), this.diskNumber === i.MAX_VALUE_16BITS || this.diskWithCentralDirStart === i.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === i.MAX_VALUE_16BITS || this.centralDirRecords === i.MAX_VALUE_16BITS || this.centralDirSize === i.MAX_VALUE_32BITS || this.centralDirOffset === i.MAX_VALUE_32BITS) {
            if (this.zip64 = true, (e2 = this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR)) < 0)
              throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");
            if (this.reader.setIndex(e2), this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR), this.readBlockZip64EndOfCentralLocator(), !this.isSignature(this.relativeOffsetEndOfZip64CentralDir, s.ZIP64_CENTRAL_DIRECTORY_END) && (this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_END), this.relativeOffsetEndOfZip64CentralDir < 0))
              throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");
            this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir), this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_END), this.readBlockZip64EndOfCentral();
          }
          var r2 = this.centralDirOffset + this.centralDirSize;
          this.zip64 && (r2 += 20, r2 += 12 + this.zip64EndOfCentralSize);
          var n2 = t2 - r2;
          if (0 < n2)
            this.isSignature(t2, s.CENTRAL_FILE_HEADER) || (this.reader.zero = n2);
          else if (n2 < 0)
            throw new Error("Corrupted zip: missing " + Math.abs(n2) + " bytes.");
        }, prepareReader: function(e2) {
          this.reader = n(e2);
        }, load: function(e2) {
          this.prepareReader(e2), this.readEndOfCentral(), this.readCentralDir(), this.readLocalFiles();
        } }, t.exports = h;
      }, { "./reader/readerFor": 22, "./signature": 23, "./support": 30, "./utf8": 31, "./utils": 32, "./zipEntry": 34 }], 34: [function(e, t, r) {
        var n = e("./reader/readerFor"), s = e("./utils"), i = e("./compressedObject"), a = e("./crc32"), o = e("./utf8"), h = e("./compressions"), u = e("./support");
        function l(e2, t2) {
          this.options = e2, this.loadOptions = t2;
        }
        l.prototype = { isEncrypted: function() {
          return 1 == (1 & this.bitFlag);
        }, useUTF8: function() {
          return 2048 == (2048 & this.bitFlag);
        }, readLocalPart: function(e2) {
          var t2, r2;
          if (e2.skip(22), this.fileNameLength = e2.readInt(2), r2 = e2.readInt(2), this.fileName = e2.readData(this.fileNameLength), e2.skip(r2), -1 === this.compressedSize || -1 === this.uncompressedSize)
            throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");
          if (null === (t2 = function(e3) {
            for (var t3 in h)
              if (h.hasOwnProperty(t3) && h[t3].magic === e3)
                return h[t3];
            return null;
          }(this.compressionMethod)))
            throw new Error("Corrupted zip : compression " + s.pretty(this.compressionMethod) + " unknown (inner file : " + s.transformTo("string", this.fileName) + ")");
          this.decompressed = new i(this.compressedSize, this.uncompressedSize, this.crc32, t2, e2.readData(this.compressedSize));
        }, readCentralPart: function(e2) {
          this.versionMadeBy = e2.readInt(2), e2.skip(2), this.bitFlag = e2.readInt(2), this.compressionMethod = e2.readString(2), this.date = e2.readDate(), this.crc32 = e2.readInt(4), this.compressedSize = e2.readInt(4), this.uncompressedSize = e2.readInt(4);
          var t2 = e2.readInt(2);
          if (this.extraFieldsLength = e2.readInt(2), this.fileCommentLength = e2.readInt(2), this.diskNumberStart = e2.readInt(2), this.internalFileAttributes = e2.readInt(2), this.externalFileAttributes = e2.readInt(4), this.localHeaderOffset = e2.readInt(4), this.isEncrypted())
            throw new Error("Encrypted zip are not supported");
          e2.skip(t2), this.readExtraFields(e2), this.parseZIP64ExtraField(e2), this.fileComment = e2.readData(this.fileCommentLength);
        }, processAttributes: function() {
          this.unixPermissions = null, this.dosPermissions = null;
          var e2 = this.versionMadeBy >> 8;
          this.dir = !!(16 & this.externalFileAttributes), 0 == e2 && (this.dosPermissions = 63 & this.externalFileAttributes), 3 == e2 && (this.unixPermissions = this.externalFileAttributes >> 16 & 65535), this.dir || "/" !== this.fileNameStr.slice(-1) || (this.dir = true);
        }, parseZIP64ExtraField: function(e2) {
          if (this.extraFields[1]) {
            var t2 = n(this.extraFields[1].value);
            this.uncompressedSize === s.MAX_VALUE_32BITS && (this.uncompressedSize = t2.readInt(8)), this.compressedSize === s.MAX_VALUE_32BITS && (this.compressedSize = t2.readInt(8)), this.localHeaderOffset === s.MAX_VALUE_32BITS && (this.localHeaderOffset = t2.readInt(8)), this.diskNumberStart === s.MAX_VALUE_32BITS && (this.diskNumberStart = t2.readInt(4));
          }
        }, readExtraFields: function(e2) {
          var t2, r2, n2, i2 = e2.index + this.extraFieldsLength;
          for (this.extraFields || (this.extraFields = {}); e2.index + 4 < i2; )
            t2 = e2.readInt(2), r2 = e2.readInt(2), n2 = e2.readData(r2), this.extraFields[t2] = { id: t2, length: r2, value: n2 };
          e2.setIndex(i2);
        }, handleUTF8: function() {
          var e2 = u.uint8array ? "uint8array" : "array";
          if (this.useUTF8())
            this.fileNameStr = o.utf8decode(this.fileName), this.fileCommentStr = o.utf8decode(this.fileComment);
          else {
            var t2 = this.findExtraFieldUnicodePath();
            if (null !== t2)
              this.fileNameStr = t2;
            else {
              var r2 = s.transformTo(e2, this.fileName);
              this.fileNameStr = this.loadOptions.decodeFileName(r2);
            }
            var n2 = this.findExtraFieldUnicodeComment();
            if (null !== n2)
              this.fileCommentStr = n2;
            else {
              var i2 = s.transformTo(e2, this.fileComment);
              this.fileCommentStr = this.loadOptions.decodeFileName(i2);
            }
          }
        }, findExtraFieldUnicodePath: function() {
          var e2 = this.extraFields[28789];
          if (e2) {
            var t2 = n(e2.value);
            return 1 !== t2.readInt(1) ? null : a(this.fileName) !== t2.readInt(4) ? null : o.utf8decode(t2.readData(e2.length - 5));
          }
          return null;
        }, findExtraFieldUnicodeComment: function() {
          var e2 = this.extraFields[25461];
          if (e2) {
            var t2 = n(e2.value);
            return 1 !== t2.readInt(1) ? null : a(this.fileComment) !== t2.readInt(4) ? null : o.utf8decode(t2.readData(e2.length - 5));
          }
          return null;
        } }, t.exports = l;
      }, { "./compressedObject": 2, "./compressions": 3, "./crc32": 4, "./reader/readerFor": 22, "./support": 30, "./utf8": 31, "./utils": 32 }], 35: [function(e, t, r) {
        function n(e2, t2, r2) {
          this.name = e2, this.dir = r2.dir, this.date = r2.date, this.comment = r2.comment, this.unixPermissions = r2.unixPermissions, this.dosPermissions = r2.dosPermissions, this._data = t2, this._dataBinary = r2.binary, this.options = { compression: r2.compression, compressionOptions: r2.compressionOptions };
        }
        var s = e("./stream/StreamHelper"), i = e("./stream/DataWorker"), a = e("./utf8"), o = e("./compressedObject"), h = e("./stream/GenericWorker");
        n.prototype = { internalStream: function(e2) {
          var t2 = null, r2 = "string";
          try {
            if (!e2)
              throw new Error("No output type specified.");
            var n2 = "string" === (r2 = e2.toLowerCase()) || "text" === r2;
            "binarystring" !== r2 && "text" !== r2 || (r2 = "string"), t2 = this._decompressWorker();
            var i2 = !this._dataBinary;
            i2 && !n2 && (t2 = t2.pipe(new a.Utf8EncodeWorker())), !i2 && n2 && (t2 = t2.pipe(new a.Utf8DecodeWorker()));
          } catch (e3) {
            (t2 = new h("error")).error(e3);
          }
          return new s(t2, r2, "");
        }, async: function(e2, t2) {
          return this.internalStream(e2).accumulate(t2);
        }, nodeStream: function(e2, t2) {
          return this.internalStream(e2 || "nodebuffer").toNodejsStream(t2);
        }, _compressWorker: function(e2, t2) {
          if (this._data instanceof o && this._data.compression.magic === e2.magic)
            return this._data.getCompressedWorker();
          var r2 = this._decompressWorker();
          return this._dataBinary || (r2 = r2.pipe(new a.Utf8EncodeWorker())), o.createWorkerFrom(r2, e2, t2);
        }, _decompressWorker: function() {
          return this._data instanceof o ? this._data.getContentWorker() : this._data instanceof h ? this._data : new i(this._data);
        } };
        for (var u = ["asText", "asBinary", "asNodeBuffer", "asUint8Array", "asArrayBuffer"], l = function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, f = 0; f < u.length; f++)
          n.prototype[u[f]] = l;
        t.exports = n;
      }, { "./compressedObject": 2, "./stream/DataWorker": 27, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31 }], 36: [function(e, l, t) {
        (function(t2) {
          var r, n, e2 = t2.MutationObserver || t2.WebKitMutationObserver;
          if (e2) {
            var i = 0, s = new e2(u), a = t2.document.createTextNode("");
            s.observe(a, { characterData: true }), r = function() {
              a.data = i = ++i % 2;
            };
          } else if (t2.setImmediate || void 0 === t2.MessageChannel)
            r = "document" in t2 && "onreadystatechange" in t2.document.createElement("script") ? function() {
              var e3 = t2.document.createElement("script");
              e3.onreadystatechange = function() {
                u(), e3.onreadystatechange = null, e3.parentNode.removeChild(e3), e3 = null;
              }, t2.document.documentElement.appendChild(e3);
            } : function() {
              setTimeout(u, 0);
            };
          else {
            var o = new t2.MessageChannel();
            o.port1.onmessage = u, r = function() {
              o.port2.postMessage(0);
            };
          }
          var h = [];
          function u() {
            var e3, t3;
            n = true;
            for (var r2 = h.length; r2; ) {
              for (t3 = h, h = [], e3 = -1; ++e3 < r2; )
                t3[e3]();
              r2 = h.length;
            }
            n = false;
          }
          l.exports = function(e3) {
            1 !== h.push(e3) || n || r();
          };
        }).call(this, "undefined" != typeof commonjsGlobal ? commonjsGlobal : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {});
      }, {}], 37: [function(e, t, r) {
        var i = e("immediate");
        function u() {
        }
        var l = {}, s = ["REJECTED"], a = ["FULFILLED"], n = ["PENDING"];
        function o(e2) {
          if ("function" != typeof e2)
            throw new TypeError("resolver must be a function");
          this.state = n, this.queue = [], this.outcome = void 0, e2 !== u && d(this, e2);
        }
        function h(e2, t2, r2) {
          this.promise = e2, "function" == typeof t2 && (this.onFulfilled = t2, this.callFulfilled = this.otherCallFulfilled), "function" == typeof r2 && (this.onRejected = r2, this.callRejected = this.otherCallRejected);
        }
        function f(t2, r2, n2) {
          i(function() {
            var e2;
            try {
              e2 = r2(n2);
            } catch (e3) {
              return l.reject(t2, e3);
            }
            e2 === t2 ? l.reject(t2, new TypeError("Cannot resolve promise with itself")) : l.resolve(t2, e2);
          });
        }
        function c(e2) {
          var t2 = e2 && e2.then;
          if (e2 && ("object" == typeof e2 || "function" == typeof e2) && "function" == typeof t2)
            return function() {
              t2.apply(e2, arguments);
            };
        }
        function d(t2, e2) {
          var r2 = false;
          function n2(e3) {
            r2 || (r2 = true, l.reject(t2, e3));
          }
          function i2(e3) {
            r2 || (r2 = true, l.resolve(t2, e3));
          }
          var s2 = p(function() {
            e2(i2, n2);
          });
          "error" === s2.status && n2(s2.value);
        }
        function p(e2, t2) {
          var r2 = {};
          try {
            r2.value = e2(t2), r2.status = "success";
          } catch (e3) {
            r2.status = "error", r2.value = e3;
          }
          return r2;
        }
        (t.exports = o).prototype.finally = function(t2) {
          if ("function" != typeof t2)
            return this;
          var r2 = this.constructor;
          return this.then(function(e2) {
            return r2.resolve(t2()).then(function() {
              return e2;
            });
          }, function(e2) {
            return r2.resolve(t2()).then(function() {
              throw e2;
            });
          });
        }, o.prototype.catch = function(e2) {
          return this.then(null, e2);
        }, o.prototype.then = function(e2, t2) {
          if ("function" != typeof e2 && this.state === a || "function" != typeof t2 && this.state === s)
            return this;
          var r2 = new this.constructor(u);
          this.state !== n ? f(r2, this.state === a ? e2 : t2, this.outcome) : this.queue.push(new h(r2, e2, t2));
          return r2;
        }, h.prototype.callFulfilled = function(e2) {
          l.resolve(this.promise, e2);
        }, h.prototype.otherCallFulfilled = function(e2) {
          f(this.promise, this.onFulfilled, e2);
        }, h.prototype.callRejected = function(e2) {
          l.reject(this.promise, e2);
        }, h.prototype.otherCallRejected = function(e2) {
          f(this.promise, this.onRejected, e2);
        }, l.resolve = function(e2, t2) {
          var r2 = p(c, t2);
          if ("error" === r2.status)
            return l.reject(e2, r2.value);
          var n2 = r2.value;
          if (n2)
            d(e2, n2);
          else {
            e2.state = a, e2.outcome = t2;
            for (var i2 = -1, s2 = e2.queue.length; ++i2 < s2; )
              e2.queue[i2].callFulfilled(t2);
          }
          return e2;
        }, l.reject = function(e2, t2) {
          e2.state = s, e2.outcome = t2;
          for (var r2 = -1, n2 = e2.queue.length; ++r2 < n2; )
            e2.queue[r2].callRejected(t2);
          return e2;
        }, o.resolve = function(e2) {
          if (e2 instanceof this)
            return e2;
          return l.resolve(new this(u), e2);
        }, o.reject = function(e2) {
          var t2 = new this(u);
          return l.reject(t2, e2);
        }, o.all = function(e2) {
          var r2 = this;
          if ("[object Array]" !== Object.prototype.toString.call(e2))
            return this.reject(new TypeError("must be an array"));
          var n2 = e2.length, i2 = false;
          if (!n2)
            return this.resolve([]);
          var s2 = new Array(n2), a2 = 0, t2 = -1, o2 = new this(u);
          for (; ++t2 < n2; )
            h2(e2[t2], t2);
          return o2;
          function h2(e3, t3) {
            r2.resolve(e3).then(function(e4) {
              s2[t3] = e4, ++a2 !== n2 || i2 || (i2 = true, l.resolve(o2, s2));
            }, function(e4) {
              i2 || (i2 = true, l.reject(o2, e4));
            });
          }
        }, o.race = function(e2) {
          var t2 = this;
          if ("[object Array]" !== Object.prototype.toString.call(e2))
            return this.reject(new TypeError("must be an array"));
          var r2 = e2.length, n2 = false;
          if (!r2)
            return this.resolve([]);
          var i2 = -1, s2 = new this(u);
          for (; ++i2 < r2; )
            a2 = e2[i2], t2.resolve(a2).then(function(e3) {
              n2 || (n2 = true, l.resolve(s2, e3));
            }, function(e3) {
              n2 || (n2 = true, l.reject(s2, e3));
            });
          var a2;
          return s2;
        };
      }, { immediate: 36 }], 38: [function(e, t, r) {
        var n = {};
        (0, e("./lib/utils/common").assign)(n, e("./lib/deflate"), e("./lib/inflate"), e("./lib/zlib/constants")), t.exports = n;
      }, { "./lib/deflate": 39, "./lib/inflate": 40, "./lib/utils/common": 41, "./lib/zlib/constants": 44 }], 39: [function(e, t, r) {
        var a = e("./zlib/deflate"), o = e("./utils/common"), h = e("./utils/strings"), i = e("./zlib/messages"), s = e("./zlib/zstream"), u = Object.prototype.toString, l = 0, f = -1, c = 0, d = 8;
        function p(e2) {
          if (!(this instanceof p))
            return new p(e2);
          this.options = o.assign({ level: f, method: d, chunkSize: 16384, windowBits: 15, memLevel: 8, strategy: c, to: "" }, e2 || {});
          var t2 = this.options;
          t2.raw && 0 < t2.windowBits ? t2.windowBits = -t2.windowBits : t2.gzip && 0 < t2.windowBits && t2.windowBits < 16 && (t2.windowBits += 16), this.err = 0, this.msg = "", this.ended = false, this.chunks = [], this.strm = new s(), this.strm.avail_out = 0;
          var r2 = a.deflateInit2(this.strm, t2.level, t2.method, t2.windowBits, t2.memLevel, t2.strategy);
          if (r2 !== l)
            throw new Error(i[r2]);
          if (t2.header && a.deflateSetHeader(this.strm, t2.header), t2.dictionary) {
            var n2;
            if (n2 = "string" == typeof t2.dictionary ? h.string2buf(t2.dictionary) : "[object ArrayBuffer]" === u.call(t2.dictionary) ? new Uint8Array(t2.dictionary) : t2.dictionary, (r2 = a.deflateSetDictionary(this.strm, n2)) !== l)
              throw new Error(i[r2]);
            this._dict_set = true;
          }
        }
        function n(e2, t2) {
          var r2 = new p(t2);
          if (r2.push(e2, true), r2.err)
            throw r2.msg || i[r2.err];
          return r2.result;
        }
        p.prototype.push = function(e2, t2) {
          var r2, n2, i2 = this.strm, s2 = this.options.chunkSize;
          if (this.ended)
            return false;
          n2 = t2 === ~~t2 ? t2 : true === t2 ? 4 : 0, "string" == typeof e2 ? i2.input = h.string2buf(e2) : "[object ArrayBuffer]" === u.call(e2) ? i2.input = new Uint8Array(e2) : i2.input = e2, i2.next_in = 0, i2.avail_in = i2.input.length;
          do {
            if (0 === i2.avail_out && (i2.output = new o.Buf8(s2), i2.next_out = 0, i2.avail_out = s2), 1 !== (r2 = a.deflate(i2, n2)) && r2 !== l)
              return this.onEnd(r2), !(this.ended = true);
            0 !== i2.avail_out && (0 !== i2.avail_in || 4 !== n2 && 2 !== n2) || ("string" === this.options.to ? this.onData(h.buf2binstring(o.shrinkBuf(i2.output, i2.next_out))) : this.onData(o.shrinkBuf(i2.output, i2.next_out)));
          } while ((0 < i2.avail_in || 0 === i2.avail_out) && 1 !== r2);
          return 4 === n2 ? (r2 = a.deflateEnd(this.strm), this.onEnd(r2), this.ended = true, r2 === l) : 2 !== n2 || (this.onEnd(l), !(i2.avail_out = 0));
        }, p.prototype.onData = function(e2) {
          this.chunks.push(e2);
        }, p.prototype.onEnd = function(e2) {
          e2 === l && ("string" === this.options.to ? this.result = this.chunks.join("") : this.result = o.flattenChunks(this.chunks)), this.chunks = [], this.err = e2, this.msg = this.strm.msg;
        }, r.Deflate = p, r.deflate = n, r.deflateRaw = function(e2, t2) {
          return (t2 = t2 || {}).raw = true, n(e2, t2);
        }, r.gzip = function(e2, t2) {
          return (t2 = t2 || {}).gzip = true, n(e2, t2);
        };
      }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/deflate": 46, "./zlib/messages": 51, "./zlib/zstream": 53 }], 40: [function(e, t, r) {
        var c = e("./zlib/inflate"), d = e("./utils/common"), p = e("./utils/strings"), m = e("./zlib/constants"), n = e("./zlib/messages"), i = e("./zlib/zstream"), s = e("./zlib/gzheader"), _2 = Object.prototype.toString;
        function a(e2) {
          if (!(this instanceof a))
            return new a(e2);
          this.options = d.assign({ chunkSize: 16384, windowBits: 0, to: "" }, e2 || {});
          var t2 = this.options;
          t2.raw && 0 <= t2.windowBits && t2.windowBits < 16 && (t2.windowBits = -t2.windowBits, 0 === t2.windowBits && (t2.windowBits = -15)), !(0 <= t2.windowBits && t2.windowBits < 16) || e2 && e2.windowBits || (t2.windowBits += 32), 15 < t2.windowBits && t2.windowBits < 48 && 0 == (15 & t2.windowBits) && (t2.windowBits |= 15), this.err = 0, this.msg = "", this.ended = false, this.chunks = [], this.strm = new i(), this.strm.avail_out = 0;
          var r2 = c.inflateInit2(this.strm, t2.windowBits);
          if (r2 !== m.Z_OK)
            throw new Error(n[r2]);
          this.header = new s(), c.inflateGetHeader(this.strm, this.header);
        }
        function o(e2, t2) {
          var r2 = new a(t2);
          if (r2.push(e2, true), r2.err)
            throw r2.msg || n[r2.err];
          return r2.result;
        }
        a.prototype.push = function(e2, t2) {
          var r2, n2, i2, s2, a2, o2, h = this.strm, u = this.options.chunkSize, l = this.options.dictionary, f = false;
          if (this.ended)
            return false;
          n2 = t2 === ~~t2 ? t2 : true === t2 ? m.Z_FINISH : m.Z_NO_FLUSH, "string" == typeof e2 ? h.input = p.binstring2buf(e2) : "[object ArrayBuffer]" === _2.call(e2) ? h.input = new Uint8Array(e2) : h.input = e2, h.next_in = 0, h.avail_in = h.input.length;
          do {
            if (0 === h.avail_out && (h.output = new d.Buf8(u), h.next_out = 0, h.avail_out = u), (r2 = c.inflate(h, m.Z_NO_FLUSH)) === m.Z_NEED_DICT && l && (o2 = "string" == typeof l ? p.string2buf(l) : "[object ArrayBuffer]" === _2.call(l) ? new Uint8Array(l) : l, r2 = c.inflateSetDictionary(this.strm, o2)), r2 === m.Z_BUF_ERROR && true === f && (r2 = m.Z_OK, f = false), r2 !== m.Z_STREAM_END && r2 !== m.Z_OK)
              return this.onEnd(r2), !(this.ended = true);
            h.next_out && (0 !== h.avail_out && r2 !== m.Z_STREAM_END && (0 !== h.avail_in || n2 !== m.Z_FINISH && n2 !== m.Z_SYNC_FLUSH) || ("string" === this.options.to ? (i2 = p.utf8border(h.output, h.next_out), s2 = h.next_out - i2, a2 = p.buf2string(h.output, i2), h.next_out = s2, h.avail_out = u - s2, s2 && d.arraySet(h.output, h.output, i2, s2, 0), this.onData(a2)) : this.onData(d.shrinkBuf(h.output, h.next_out)))), 0 === h.avail_in && 0 === h.avail_out && (f = true);
          } while ((0 < h.avail_in || 0 === h.avail_out) && r2 !== m.Z_STREAM_END);
          return r2 === m.Z_STREAM_END && (n2 = m.Z_FINISH), n2 === m.Z_FINISH ? (r2 = c.inflateEnd(this.strm), this.onEnd(r2), this.ended = true, r2 === m.Z_OK) : n2 !== m.Z_SYNC_FLUSH || (this.onEnd(m.Z_OK), !(h.avail_out = 0));
        }, a.prototype.onData = function(e2) {
          this.chunks.push(e2);
        }, a.prototype.onEnd = function(e2) {
          e2 === m.Z_OK && ("string" === this.options.to ? this.result = this.chunks.join("") : this.result = d.flattenChunks(this.chunks)), this.chunks = [], this.err = e2, this.msg = this.strm.msg;
        }, r.Inflate = a, r.inflate = o, r.inflateRaw = function(e2, t2) {
          return (t2 = t2 || {}).raw = true, o(e2, t2);
        }, r.ungzip = o;
      }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/constants": 44, "./zlib/gzheader": 47, "./zlib/inflate": 49, "./zlib/messages": 51, "./zlib/zstream": 53 }], 41: [function(e, t, r) {
        var n = "undefined" != typeof Uint8Array && "undefined" != typeof Uint16Array && "undefined" != typeof Int32Array;
        r.assign = function(e2) {
          for (var t2 = Array.prototype.slice.call(arguments, 1); t2.length; ) {
            var r2 = t2.shift();
            if (r2) {
              if ("object" != typeof r2)
                throw new TypeError(r2 + "must be non-object");
              for (var n2 in r2)
                r2.hasOwnProperty(n2) && (e2[n2] = r2[n2]);
            }
          }
          return e2;
        }, r.shrinkBuf = function(e2, t2) {
          return e2.length === t2 ? e2 : e2.subarray ? e2.subarray(0, t2) : (e2.length = t2, e2);
        };
        var i = { arraySet: function(e2, t2, r2, n2, i2) {
          if (t2.subarray && e2.subarray)
            e2.set(t2.subarray(r2, r2 + n2), i2);
          else
            for (var s2 = 0; s2 < n2; s2++)
              e2[i2 + s2] = t2[r2 + s2];
        }, flattenChunks: function(e2) {
          var t2, r2, n2, i2, s2, a;
          for (t2 = n2 = 0, r2 = e2.length; t2 < r2; t2++)
            n2 += e2[t2].length;
          for (a = new Uint8Array(n2), t2 = i2 = 0, r2 = e2.length; t2 < r2; t2++)
            s2 = e2[t2], a.set(s2, i2), i2 += s2.length;
          return a;
        } }, s = { arraySet: function(e2, t2, r2, n2, i2) {
          for (var s2 = 0; s2 < n2; s2++)
            e2[i2 + s2] = t2[r2 + s2];
        }, flattenChunks: function(e2) {
          return [].concat.apply([], e2);
        } };
        r.setTyped = function(e2) {
          e2 ? (r.Buf8 = Uint8Array, r.Buf16 = Uint16Array, r.Buf32 = Int32Array, r.assign(r, i)) : (r.Buf8 = Array, r.Buf16 = Array, r.Buf32 = Array, r.assign(r, s));
        }, r.setTyped(n);
      }, {}], 42: [function(e, t, r) {
        var h = e("./common"), i = true, s = true;
        try {
          String.fromCharCode.apply(null, [0]);
        } catch (e2) {
          i = false;
        }
        try {
          String.fromCharCode.apply(null, new Uint8Array(1));
        } catch (e2) {
          s = false;
        }
        for (var u = new h.Buf8(256), n = 0; n < 256; n++)
          u[n] = 252 <= n ? 6 : 248 <= n ? 5 : 240 <= n ? 4 : 224 <= n ? 3 : 192 <= n ? 2 : 1;
        function l(e2, t2) {
          if (t2 < 65537 && (e2.subarray && s || !e2.subarray && i))
            return String.fromCharCode.apply(null, h.shrinkBuf(e2, t2));
          for (var r2 = "", n2 = 0; n2 < t2; n2++)
            r2 += String.fromCharCode(e2[n2]);
          return r2;
        }
        u[254] = u[254] = 1, r.string2buf = function(e2) {
          var t2, r2, n2, i2, s2, a = e2.length, o = 0;
          for (i2 = 0; i2 < a; i2++)
            55296 == (64512 & (r2 = e2.charCodeAt(i2))) && i2 + 1 < a && 56320 == (64512 & (n2 = e2.charCodeAt(i2 + 1))) && (r2 = 65536 + (r2 - 55296 << 10) + (n2 - 56320), i2++), o += r2 < 128 ? 1 : r2 < 2048 ? 2 : r2 < 65536 ? 3 : 4;
          for (t2 = new h.Buf8(o), i2 = s2 = 0; s2 < o; i2++)
            55296 == (64512 & (r2 = e2.charCodeAt(i2))) && i2 + 1 < a && 56320 == (64512 & (n2 = e2.charCodeAt(i2 + 1))) && (r2 = 65536 + (r2 - 55296 << 10) + (n2 - 56320), i2++), r2 < 128 ? t2[s2++] = r2 : (r2 < 2048 ? t2[s2++] = 192 | r2 >>> 6 : (r2 < 65536 ? t2[s2++] = 224 | r2 >>> 12 : (t2[s2++] = 240 | r2 >>> 18, t2[s2++] = 128 | r2 >>> 12 & 63), t2[s2++] = 128 | r2 >>> 6 & 63), t2[s2++] = 128 | 63 & r2);
          return t2;
        }, r.buf2binstring = function(e2) {
          return l(e2, e2.length);
        }, r.binstring2buf = function(e2) {
          for (var t2 = new h.Buf8(e2.length), r2 = 0, n2 = t2.length; r2 < n2; r2++)
            t2[r2] = e2.charCodeAt(r2);
          return t2;
        }, r.buf2string = function(e2, t2) {
          var r2, n2, i2, s2, a = t2 || e2.length, o = new Array(2 * a);
          for (r2 = n2 = 0; r2 < a; )
            if ((i2 = e2[r2++]) < 128)
              o[n2++] = i2;
            else if (4 < (s2 = u[i2]))
              o[n2++] = 65533, r2 += s2 - 1;
            else {
              for (i2 &= 2 === s2 ? 31 : 3 === s2 ? 15 : 7; 1 < s2 && r2 < a; )
                i2 = i2 << 6 | 63 & e2[r2++], s2--;
              1 < s2 ? o[n2++] = 65533 : i2 < 65536 ? o[n2++] = i2 : (i2 -= 65536, o[n2++] = 55296 | i2 >> 10 & 1023, o[n2++] = 56320 | 1023 & i2);
            }
          return l(o, n2);
        }, r.utf8border = function(e2, t2) {
          var r2;
          for ((t2 = t2 || e2.length) > e2.length && (t2 = e2.length), r2 = t2 - 1; 0 <= r2 && 128 == (192 & e2[r2]); )
            r2--;
          return r2 < 0 ? t2 : 0 === r2 ? t2 : r2 + u[e2[r2]] > t2 ? r2 : t2;
        };
      }, { "./common": 41 }], 43: [function(e, t, r) {
        t.exports = function(e2, t2, r2, n) {
          for (var i = 65535 & e2 | 0, s = e2 >>> 16 & 65535 | 0, a = 0; 0 !== r2; ) {
            for (r2 -= a = 2e3 < r2 ? 2e3 : r2; s = s + (i = i + t2[n++] | 0) | 0, --a; )
              ;
            i %= 65521, s %= 65521;
          }
          return i | s << 16 | 0;
        };
      }, {}], 44: [function(e, t, r) {
        t.exports = { Z_NO_FLUSH: 0, Z_PARTIAL_FLUSH: 1, Z_SYNC_FLUSH: 2, Z_FULL_FLUSH: 3, Z_FINISH: 4, Z_BLOCK: 5, Z_TREES: 6, Z_OK: 0, Z_STREAM_END: 1, Z_NEED_DICT: 2, Z_ERRNO: -1, Z_STREAM_ERROR: -2, Z_DATA_ERROR: -3, Z_BUF_ERROR: -5, Z_NO_COMPRESSION: 0, Z_BEST_SPEED: 1, Z_BEST_COMPRESSION: 9, Z_DEFAULT_COMPRESSION: -1, Z_FILTERED: 1, Z_HUFFMAN_ONLY: 2, Z_RLE: 3, Z_FIXED: 4, Z_DEFAULT_STRATEGY: 0, Z_BINARY: 0, Z_TEXT: 1, Z_UNKNOWN: 2, Z_DEFLATED: 8 };
      }, {}], 45: [function(e, t, r) {
        var o = function() {
          for (var e2, t2 = [], r2 = 0; r2 < 256; r2++) {
            e2 = r2;
            for (var n = 0; n < 8; n++)
              e2 = 1 & e2 ? 3988292384 ^ e2 >>> 1 : e2 >>> 1;
            t2[r2] = e2;
          }
          return t2;
        }();
        t.exports = function(e2, t2, r2, n) {
          var i = o, s = n + r2;
          e2 ^= -1;
          for (var a = n; a < s; a++)
            e2 = e2 >>> 8 ^ i[255 & (e2 ^ t2[a])];
          return -1 ^ e2;
        };
      }, {}], 46: [function(e, t, r) {
        var h, c = e("../utils/common"), u = e("./trees"), d = e("./adler32"), p = e("./crc32"), n = e("./messages"), l = 0, f = 4, m = 0, _2 = -2, g = -1, b = 4, i = 2, v = 8, y = 9, s = 286, a = 30, o = 19, w = 2 * s + 1, k = 15, x = 3, S = 258, z = S + x + 1, C = 42, E = 113, A = 1, I = 2, O = 3, B = 4;
        function R(e2, t2) {
          return e2.msg = n[t2], t2;
        }
        function T(e2) {
          return (e2 << 1) - (4 < e2 ? 9 : 0);
        }
        function D(e2) {
          for (var t2 = e2.length; 0 <= --t2; )
            e2[t2] = 0;
        }
        function F(e2) {
          var t2 = e2.state, r2 = t2.pending;
          r2 > e2.avail_out && (r2 = e2.avail_out), 0 !== r2 && (c.arraySet(e2.output, t2.pending_buf, t2.pending_out, r2, e2.next_out), e2.next_out += r2, t2.pending_out += r2, e2.total_out += r2, e2.avail_out -= r2, t2.pending -= r2, 0 === t2.pending && (t2.pending_out = 0));
        }
        function N(e2, t2) {
          u._tr_flush_block(e2, 0 <= e2.block_start ? e2.block_start : -1, e2.strstart - e2.block_start, t2), e2.block_start = e2.strstart, F(e2.strm);
        }
        function U(e2, t2) {
          e2.pending_buf[e2.pending++] = t2;
        }
        function P(e2, t2) {
          e2.pending_buf[e2.pending++] = t2 >>> 8 & 255, e2.pending_buf[e2.pending++] = 255 & t2;
        }
        function L(e2, t2) {
          var r2, n2, i2 = e2.max_chain_length, s2 = e2.strstart, a2 = e2.prev_length, o2 = e2.nice_match, h2 = e2.strstart > e2.w_size - z ? e2.strstart - (e2.w_size - z) : 0, u2 = e2.window, l2 = e2.w_mask, f2 = e2.prev, c2 = e2.strstart + S, d2 = u2[s2 + a2 - 1], p2 = u2[s2 + a2];
          e2.prev_length >= e2.good_match && (i2 >>= 2), o2 > e2.lookahead && (o2 = e2.lookahead);
          do {
            if (u2[(r2 = t2) + a2] === p2 && u2[r2 + a2 - 1] === d2 && u2[r2] === u2[s2] && u2[++r2] === u2[s2 + 1]) {
              s2 += 2, r2++;
              do {
              } while (u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && s2 < c2);
              if (n2 = S - (c2 - s2), s2 = c2 - S, a2 < n2) {
                if (e2.match_start = t2, o2 <= (a2 = n2))
                  break;
                d2 = u2[s2 + a2 - 1], p2 = u2[s2 + a2];
              }
            }
          } while ((t2 = f2[t2 & l2]) > h2 && 0 != --i2);
          return a2 <= e2.lookahead ? a2 : e2.lookahead;
        }
        function j(e2) {
          var t2, r2, n2, i2, s2, a2, o2, h2, u2, l2, f2 = e2.w_size;
          do {
            if (i2 = e2.window_size - e2.lookahead - e2.strstart, e2.strstart >= f2 + (f2 - z)) {
              for (c.arraySet(e2.window, e2.window, f2, f2, 0), e2.match_start -= f2, e2.strstart -= f2, e2.block_start -= f2, t2 = r2 = e2.hash_size; n2 = e2.head[--t2], e2.head[t2] = f2 <= n2 ? n2 - f2 : 0, --r2; )
                ;
              for (t2 = r2 = f2; n2 = e2.prev[--t2], e2.prev[t2] = f2 <= n2 ? n2 - f2 : 0, --r2; )
                ;
              i2 += f2;
            }
            if (0 === e2.strm.avail_in)
              break;
            if (a2 = e2.strm, o2 = e2.window, h2 = e2.strstart + e2.lookahead, u2 = i2, l2 = void 0, l2 = a2.avail_in, u2 < l2 && (l2 = u2), r2 = 0 === l2 ? 0 : (a2.avail_in -= l2, c.arraySet(o2, a2.input, a2.next_in, l2, h2), 1 === a2.state.wrap ? a2.adler = d(a2.adler, o2, l2, h2) : 2 === a2.state.wrap && (a2.adler = p(a2.adler, o2, l2, h2)), a2.next_in += l2, a2.total_in += l2, l2), e2.lookahead += r2, e2.lookahead + e2.insert >= x)
              for (s2 = e2.strstart - e2.insert, e2.ins_h = e2.window[s2], e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[s2 + 1]) & e2.hash_mask; e2.insert && (e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[s2 + x - 1]) & e2.hash_mask, e2.prev[s2 & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = s2, s2++, e2.insert--, !(e2.lookahead + e2.insert < x)); )
                ;
          } while (e2.lookahead < z && 0 !== e2.strm.avail_in);
        }
        function Z(e2, t2) {
          for (var r2, n2; ; ) {
            if (e2.lookahead < z) {
              if (j(e2), e2.lookahead < z && t2 === l)
                return A;
              if (0 === e2.lookahead)
                break;
            }
            if (r2 = 0, e2.lookahead >= x && (e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + x - 1]) & e2.hash_mask, r2 = e2.prev[e2.strstart & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = e2.strstart), 0 !== r2 && e2.strstart - r2 <= e2.w_size - z && (e2.match_length = L(e2, r2)), e2.match_length >= x)
              if (n2 = u._tr_tally(e2, e2.strstart - e2.match_start, e2.match_length - x), e2.lookahead -= e2.match_length, e2.match_length <= e2.max_lazy_match && e2.lookahead >= x) {
                for (e2.match_length--; e2.strstart++, e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + x - 1]) & e2.hash_mask, r2 = e2.prev[e2.strstart & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = e2.strstart, 0 != --e2.match_length; )
                  ;
                e2.strstart++;
              } else
                e2.strstart += e2.match_length, e2.match_length = 0, e2.ins_h = e2.window[e2.strstart], e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + 1]) & e2.hash_mask;
            else
              n2 = u._tr_tally(e2, 0, e2.window[e2.strstart]), e2.lookahead--, e2.strstart++;
            if (n2 && (N(e2, false), 0 === e2.strm.avail_out))
              return A;
          }
          return e2.insert = e2.strstart < x - 1 ? e2.strstart : x - 1, t2 === f ? (N(e2, true), 0 === e2.strm.avail_out ? O : B) : e2.last_lit && (N(e2, false), 0 === e2.strm.avail_out) ? A : I;
        }
        function W(e2, t2) {
          for (var r2, n2, i2; ; ) {
            if (e2.lookahead < z) {
              if (j(e2), e2.lookahead < z && t2 === l)
                return A;
              if (0 === e2.lookahead)
                break;
            }
            if (r2 = 0, e2.lookahead >= x && (e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + x - 1]) & e2.hash_mask, r2 = e2.prev[e2.strstart & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = e2.strstart), e2.prev_length = e2.match_length, e2.prev_match = e2.match_start, e2.match_length = x - 1, 0 !== r2 && e2.prev_length < e2.max_lazy_match && e2.strstart - r2 <= e2.w_size - z && (e2.match_length = L(e2, r2), e2.match_length <= 5 && (1 === e2.strategy || e2.match_length === x && 4096 < e2.strstart - e2.match_start) && (e2.match_length = x - 1)), e2.prev_length >= x && e2.match_length <= e2.prev_length) {
              for (i2 = e2.strstart + e2.lookahead - x, n2 = u._tr_tally(e2, e2.strstart - 1 - e2.prev_match, e2.prev_length - x), e2.lookahead -= e2.prev_length - 1, e2.prev_length -= 2; ++e2.strstart <= i2 && (e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + x - 1]) & e2.hash_mask, r2 = e2.prev[e2.strstart & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = e2.strstart), 0 != --e2.prev_length; )
                ;
              if (e2.match_available = 0, e2.match_length = x - 1, e2.strstart++, n2 && (N(e2, false), 0 === e2.strm.avail_out))
                return A;
            } else if (e2.match_available) {
              if ((n2 = u._tr_tally(e2, 0, e2.window[e2.strstart - 1])) && N(e2, false), e2.strstart++, e2.lookahead--, 0 === e2.strm.avail_out)
                return A;
            } else
              e2.match_available = 1, e2.strstart++, e2.lookahead--;
          }
          return e2.match_available && (n2 = u._tr_tally(e2, 0, e2.window[e2.strstart - 1]), e2.match_available = 0), e2.insert = e2.strstart < x - 1 ? e2.strstart : x - 1, t2 === f ? (N(e2, true), 0 === e2.strm.avail_out ? O : B) : e2.last_lit && (N(e2, false), 0 === e2.strm.avail_out) ? A : I;
        }
        function M(e2, t2, r2, n2, i2) {
          this.good_length = e2, this.max_lazy = t2, this.nice_length = r2, this.max_chain = n2, this.func = i2;
        }
        function H() {
          this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = v, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new c.Buf16(2 * w), this.dyn_dtree = new c.Buf16(2 * (2 * a + 1)), this.bl_tree = new c.Buf16(2 * (2 * o + 1)), D(this.dyn_ltree), D(this.dyn_dtree), D(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new c.Buf16(k + 1), this.heap = new c.Buf16(2 * s + 1), D(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new c.Buf16(2 * s + 1), D(this.depth), this.l_buf = 0, this.lit_bufsize = 0, this.last_lit = 0, this.d_buf = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
        }
        function G(e2) {
          var t2;
          return e2 && e2.state ? (e2.total_in = e2.total_out = 0, e2.data_type = i, (t2 = e2.state).pending = 0, t2.pending_out = 0, t2.wrap < 0 && (t2.wrap = -t2.wrap), t2.status = t2.wrap ? C : E, e2.adler = 2 === t2.wrap ? 0 : 1, t2.last_flush = l, u._tr_init(t2), m) : R(e2, _2);
        }
        function K(e2) {
          var t2 = G(e2);
          return t2 === m && function(e3) {
            e3.window_size = 2 * e3.w_size, D(e3.head), e3.max_lazy_match = h[e3.level].max_lazy, e3.good_match = h[e3.level].good_length, e3.nice_match = h[e3.level].nice_length, e3.max_chain_length = h[e3.level].max_chain, e3.strstart = 0, e3.block_start = 0, e3.lookahead = 0, e3.insert = 0, e3.match_length = e3.prev_length = x - 1, e3.match_available = 0, e3.ins_h = 0;
          }(e2.state), t2;
        }
        function Y(e2, t2, r2, n2, i2, s2) {
          if (!e2)
            return _2;
          var a2 = 1;
          if (t2 === g && (t2 = 6), n2 < 0 ? (a2 = 0, n2 = -n2) : 15 < n2 && (a2 = 2, n2 -= 16), i2 < 1 || y < i2 || r2 !== v || n2 < 8 || 15 < n2 || t2 < 0 || 9 < t2 || s2 < 0 || b < s2)
            return R(e2, _2);
          8 === n2 && (n2 = 9);
          var o2 = new H();
          return (e2.state = o2).strm = e2, o2.wrap = a2, o2.gzhead = null, o2.w_bits = n2, o2.w_size = 1 << o2.w_bits, o2.w_mask = o2.w_size - 1, o2.hash_bits = i2 + 7, o2.hash_size = 1 << o2.hash_bits, o2.hash_mask = o2.hash_size - 1, o2.hash_shift = ~~((o2.hash_bits + x - 1) / x), o2.window = new c.Buf8(2 * o2.w_size), o2.head = new c.Buf16(o2.hash_size), o2.prev = new c.Buf16(o2.w_size), o2.lit_bufsize = 1 << i2 + 6, o2.pending_buf_size = 4 * o2.lit_bufsize, o2.pending_buf = new c.Buf8(o2.pending_buf_size), o2.d_buf = 1 * o2.lit_bufsize, o2.l_buf = 3 * o2.lit_bufsize, o2.level = t2, o2.strategy = s2, o2.method = r2, K(e2);
        }
        h = [new M(0, 0, 0, 0, function(e2, t2) {
          var r2 = 65535;
          for (r2 > e2.pending_buf_size - 5 && (r2 = e2.pending_buf_size - 5); ; ) {
            if (e2.lookahead <= 1) {
              if (j(e2), 0 === e2.lookahead && t2 === l)
                return A;
              if (0 === e2.lookahead)
                break;
            }
            e2.strstart += e2.lookahead, e2.lookahead = 0;
            var n2 = e2.block_start + r2;
            if ((0 === e2.strstart || e2.strstart >= n2) && (e2.lookahead = e2.strstart - n2, e2.strstart = n2, N(e2, false), 0 === e2.strm.avail_out))
              return A;
            if (e2.strstart - e2.block_start >= e2.w_size - z && (N(e2, false), 0 === e2.strm.avail_out))
              return A;
          }
          return e2.insert = 0, t2 === f ? (N(e2, true), 0 === e2.strm.avail_out ? O : B) : (e2.strstart > e2.block_start && (N(e2, false), e2.strm.avail_out), A);
        }), new M(4, 4, 8, 4, Z), new M(4, 5, 16, 8, Z), new M(4, 6, 32, 32, Z), new M(4, 4, 16, 16, W), new M(8, 16, 32, 32, W), new M(8, 16, 128, 128, W), new M(8, 32, 128, 256, W), new M(32, 128, 258, 1024, W), new M(32, 258, 258, 4096, W)], r.deflateInit = function(e2, t2) {
          return Y(e2, t2, v, 15, 8, 0);
        }, r.deflateInit2 = Y, r.deflateReset = K, r.deflateResetKeep = G, r.deflateSetHeader = function(e2, t2) {
          return e2 && e2.state ? 2 !== e2.state.wrap ? _2 : (e2.state.gzhead = t2, m) : _2;
        }, r.deflate = function(e2, t2) {
          var r2, n2, i2, s2;
          if (!e2 || !e2.state || 5 < t2 || t2 < 0)
            return e2 ? R(e2, _2) : _2;
          if (n2 = e2.state, !e2.output || !e2.input && 0 !== e2.avail_in || 666 === n2.status && t2 !== f)
            return R(e2, 0 === e2.avail_out ? -5 : _2);
          if (n2.strm = e2, r2 = n2.last_flush, n2.last_flush = t2, n2.status === C)
            if (2 === n2.wrap)
              e2.adler = 0, U(n2, 31), U(n2, 139), U(n2, 8), n2.gzhead ? (U(n2, (n2.gzhead.text ? 1 : 0) + (n2.gzhead.hcrc ? 2 : 0) + (n2.gzhead.extra ? 4 : 0) + (n2.gzhead.name ? 8 : 0) + (n2.gzhead.comment ? 16 : 0)), U(n2, 255 & n2.gzhead.time), U(n2, n2.gzhead.time >> 8 & 255), U(n2, n2.gzhead.time >> 16 & 255), U(n2, n2.gzhead.time >> 24 & 255), U(n2, 9 === n2.level ? 2 : 2 <= n2.strategy || n2.level < 2 ? 4 : 0), U(n2, 255 & n2.gzhead.os), n2.gzhead.extra && n2.gzhead.extra.length && (U(n2, 255 & n2.gzhead.extra.length), U(n2, n2.gzhead.extra.length >> 8 & 255)), n2.gzhead.hcrc && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending, 0)), n2.gzindex = 0, n2.status = 69) : (U(n2, 0), U(n2, 0), U(n2, 0), U(n2, 0), U(n2, 0), U(n2, 9 === n2.level ? 2 : 2 <= n2.strategy || n2.level < 2 ? 4 : 0), U(n2, 3), n2.status = E);
            else {
              var a2 = v + (n2.w_bits - 8 << 4) << 8;
              a2 |= (2 <= n2.strategy || n2.level < 2 ? 0 : n2.level < 6 ? 1 : 6 === n2.level ? 2 : 3) << 6, 0 !== n2.strstart && (a2 |= 32), a2 += 31 - a2 % 31, n2.status = E, P(n2, a2), 0 !== n2.strstart && (P(n2, e2.adler >>> 16), P(n2, 65535 & e2.adler)), e2.adler = 1;
            }
          if (69 === n2.status)
            if (n2.gzhead.extra) {
              for (i2 = n2.pending; n2.gzindex < (65535 & n2.gzhead.extra.length) && (n2.pending !== n2.pending_buf_size || (n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), F(e2), i2 = n2.pending, n2.pending !== n2.pending_buf_size)); )
                U(n2, 255 & n2.gzhead.extra[n2.gzindex]), n2.gzindex++;
              n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), n2.gzindex === n2.gzhead.extra.length && (n2.gzindex = 0, n2.status = 73);
            } else
              n2.status = 73;
          if (73 === n2.status)
            if (n2.gzhead.name) {
              i2 = n2.pending;
              do {
                if (n2.pending === n2.pending_buf_size && (n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), F(e2), i2 = n2.pending, n2.pending === n2.pending_buf_size)) {
                  s2 = 1;
                  break;
                }
                s2 = n2.gzindex < n2.gzhead.name.length ? 255 & n2.gzhead.name.charCodeAt(n2.gzindex++) : 0, U(n2, s2);
              } while (0 !== s2);
              n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), 0 === s2 && (n2.gzindex = 0, n2.status = 91);
            } else
              n2.status = 91;
          if (91 === n2.status)
            if (n2.gzhead.comment) {
              i2 = n2.pending;
              do {
                if (n2.pending === n2.pending_buf_size && (n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), F(e2), i2 = n2.pending, n2.pending === n2.pending_buf_size)) {
                  s2 = 1;
                  break;
                }
                s2 = n2.gzindex < n2.gzhead.comment.length ? 255 & n2.gzhead.comment.charCodeAt(n2.gzindex++) : 0, U(n2, s2);
              } while (0 !== s2);
              n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), 0 === s2 && (n2.status = 103);
            } else
              n2.status = 103;
          if (103 === n2.status && (n2.gzhead.hcrc ? (n2.pending + 2 > n2.pending_buf_size && F(e2), n2.pending + 2 <= n2.pending_buf_size && (U(n2, 255 & e2.adler), U(n2, e2.adler >> 8 & 255), e2.adler = 0, n2.status = E)) : n2.status = E), 0 !== n2.pending) {
            if (F(e2), 0 === e2.avail_out)
              return n2.last_flush = -1, m;
          } else if (0 === e2.avail_in && T(t2) <= T(r2) && t2 !== f)
            return R(e2, -5);
          if (666 === n2.status && 0 !== e2.avail_in)
            return R(e2, -5);
          if (0 !== e2.avail_in || 0 !== n2.lookahead || t2 !== l && 666 !== n2.status) {
            var o2 = 2 === n2.strategy ? function(e3, t3) {
              for (var r3; ; ) {
                if (0 === e3.lookahead && (j(e3), 0 === e3.lookahead)) {
                  if (t3 === l)
                    return A;
                  break;
                }
                if (e3.match_length = 0, r3 = u._tr_tally(e3, 0, e3.window[e3.strstart]), e3.lookahead--, e3.strstart++, r3 && (N(e3, false), 0 === e3.strm.avail_out))
                  return A;
              }
              return e3.insert = 0, t3 === f ? (N(e3, true), 0 === e3.strm.avail_out ? O : B) : e3.last_lit && (N(e3, false), 0 === e3.strm.avail_out) ? A : I;
            }(n2, t2) : 3 === n2.strategy ? function(e3, t3) {
              for (var r3, n3, i3, s3, a3 = e3.window; ; ) {
                if (e3.lookahead <= S) {
                  if (j(e3), e3.lookahead <= S && t3 === l)
                    return A;
                  if (0 === e3.lookahead)
                    break;
                }
                if (e3.match_length = 0, e3.lookahead >= x && 0 < e3.strstart && (n3 = a3[i3 = e3.strstart - 1]) === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3]) {
                  s3 = e3.strstart + S;
                  do {
                  } while (n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && i3 < s3);
                  e3.match_length = S - (s3 - i3), e3.match_length > e3.lookahead && (e3.match_length = e3.lookahead);
                }
                if (e3.match_length >= x ? (r3 = u._tr_tally(e3, 1, e3.match_length - x), e3.lookahead -= e3.match_length, e3.strstart += e3.match_length, e3.match_length = 0) : (r3 = u._tr_tally(e3, 0, e3.window[e3.strstart]), e3.lookahead--, e3.strstart++), r3 && (N(e3, false), 0 === e3.strm.avail_out))
                  return A;
              }
              return e3.insert = 0, t3 === f ? (N(e3, true), 0 === e3.strm.avail_out ? O : B) : e3.last_lit && (N(e3, false), 0 === e3.strm.avail_out) ? A : I;
            }(n2, t2) : h[n2.level].func(n2, t2);
            if (o2 !== O && o2 !== B || (n2.status = 666), o2 === A || o2 === O)
              return 0 === e2.avail_out && (n2.last_flush = -1), m;
            if (o2 === I && (1 === t2 ? u._tr_align(n2) : 5 !== t2 && (u._tr_stored_block(n2, 0, 0, false), 3 === t2 && (D(n2.head), 0 === n2.lookahead && (n2.strstart = 0, n2.block_start = 0, n2.insert = 0))), F(e2), 0 === e2.avail_out))
              return n2.last_flush = -1, m;
          }
          return t2 !== f ? m : n2.wrap <= 0 ? 1 : (2 === n2.wrap ? (U(n2, 255 & e2.adler), U(n2, e2.adler >> 8 & 255), U(n2, e2.adler >> 16 & 255), U(n2, e2.adler >> 24 & 255), U(n2, 255 & e2.total_in), U(n2, e2.total_in >> 8 & 255), U(n2, e2.total_in >> 16 & 255), U(n2, e2.total_in >> 24 & 255)) : (P(n2, e2.adler >>> 16), P(n2, 65535 & e2.adler)), F(e2), 0 < n2.wrap && (n2.wrap = -n2.wrap), 0 !== n2.pending ? m : 1);
        }, r.deflateEnd = function(e2) {
          var t2;
          return e2 && e2.state ? (t2 = e2.state.status) !== C && 69 !== t2 && 73 !== t2 && 91 !== t2 && 103 !== t2 && t2 !== E && 666 !== t2 ? R(e2, _2) : (e2.state = null, t2 === E ? R(e2, -3) : m) : _2;
        }, r.deflateSetDictionary = function(e2, t2) {
          var r2, n2, i2, s2, a2, o2, h2, u2, l2 = t2.length;
          if (!e2 || !e2.state)
            return _2;
          if (2 === (s2 = (r2 = e2.state).wrap) || 1 === s2 && r2.status !== C || r2.lookahead)
            return _2;
          for (1 === s2 && (e2.adler = d(e2.adler, t2, l2, 0)), r2.wrap = 0, l2 >= r2.w_size && (0 === s2 && (D(r2.head), r2.strstart = 0, r2.block_start = 0, r2.insert = 0), u2 = new c.Buf8(r2.w_size), c.arraySet(u2, t2, l2 - r2.w_size, r2.w_size, 0), t2 = u2, l2 = r2.w_size), a2 = e2.avail_in, o2 = e2.next_in, h2 = e2.input, e2.avail_in = l2, e2.next_in = 0, e2.input = t2, j(r2); r2.lookahead >= x; ) {
            for (n2 = r2.strstart, i2 = r2.lookahead - (x - 1); r2.ins_h = (r2.ins_h << r2.hash_shift ^ r2.window[n2 + x - 1]) & r2.hash_mask, r2.prev[n2 & r2.w_mask] = r2.head[r2.ins_h], r2.head[r2.ins_h] = n2, n2++, --i2; )
              ;
            r2.strstart = n2, r2.lookahead = x - 1, j(r2);
          }
          return r2.strstart += r2.lookahead, r2.block_start = r2.strstart, r2.insert = r2.lookahead, r2.lookahead = 0, r2.match_length = r2.prev_length = x - 1, r2.match_available = 0, e2.next_in = o2, e2.input = h2, e2.avail_in = a2, r2.wrap = s2, m;
        }, r.deflateInfo = "pako deflate (from Nodeca project)";
      }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./messages": 51, "./trees": 52 }], 47: [function(e, t, r) {
        t.exports = function() {
          this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = false;
        };
      }, {}], 48: [function(e, t, r) {
        t.exports = function(e2, t2) {
          var r2, n, i, s, a, o, h, u, l, f, c, d, p, m, _2, g, b, v, y, w, k, x, S, z, C;
          r2 = e2.state, n = e2.next_in, z = e2.input, i = n + (e2.avail_in - 5), s = e2.next_out, C = e2.output, a = s - (t2 - e2.avail_out), o = s + (e2.avail_out - 257), h = r2.dmax, u = r2.wsize, l = r2.whave, f = r2.wnext, c = r2.window, d = r2.hold, p = r2.bits, m = r2.lencode, _2 = r2.distcode, g = (1 << r2.lenbits) - 1, b = (1 << r2.distbits) - 1;
          e:
            do {
              p < 15 && (d += z[n++] << p, p += 8, d += z[n++] << p, p += 8), v = m[d & g];
              t:
                for (; ; ) {
                  if (d >>>= y = v >>> 24, p -= y, 0 === (y = v >>> 16 & 255))
                    C[s++] = 65535 & v;
                  else {
                    if (!(16 & y)) {
                      if (0 == (64 & y)) {
                        v = m[(65535 & v) + (d & (1 << y) - 1)];
                        continue t;
                      }
                      if (32 & y) {
                        r2.mode = 12;
                        break e;
                      }
                      e2.msg = "invalid literal/length code", r2.mode = 30;
                      break e;
                    }
                    w = 65535 & v, (y &= 15) && (p < y && (d += z[n++] << p, p += 8), w += d & (1 << y) - 1, d >>>= y, p -= y), p < 15 && (d += z[n++] << p, p += 8, d += z[n++] << p, p += 8), v = _2[d & b];
                    r:
                      for (; ; ) {
                        if (d >>>= y = v >>> 24, p -= y, !(16 & (y = v >>> 16 & 255))) {
                          if (0 == (64 & y)) {
                            v = _2[(65535 & v) + (d & (1 << y) - 1)];
                            continue r;
                          }
                          e2.msg = "invalid distance code", r2.mode = 30;
                          break e;
                        }
                        if (k = 65535 & v, p < (y &= 15) && (d += z[n++] << p, (p += 8) < y && (d += z[n++] << p, p += 8)), h < (k += d & (1 << y) - 1)) {
                          e2.msg = "invalid distance too far back", r2.mode = 30;
                          break e;
                        }
                        if (d >>>= y, p -= y, (y = s - a) < k) {
                          if (l < (y = k - y) && r2.sane) {
                            e2.msg = "invalid distance too far back", r2.mode = 30;
                            break e;
                          }
                          if (S = c, (x = 0) === f) {
                            if (x += u - y, y < w) {
                              for (w -= y; C[s++] = c[x++], --y; )
                                ;
                              x = s - k, S = C;
                            }
                          } else if (f < y) {
                            if (x += u + f - y, (y -= f) < w) {
                              for (w -= y; C[s++] = c[x++], --y; )
                                ;
                              if (x = 0, f < w) {
                                for (w -= y = f; C[s++] = c[x++], --y; )
                                  ;
                                x = s - k, S = C;
                              }
                            }
                          } else if (x += f - y, y < w) {
                            for (w -= y; C[s++] = c[x++], --y; )
                              ;
                            x = s - k, S = C;
                          }
                          for (; 2 < w; )
                            C[s++] = S[x++], C[s++] = S[x++], C[s++] = S[x++], w -= 3;
                          w && (C[s++] = S[x++], 1 < w && (C[s++] = S[x++]));
                        } else {
                          for (x = s - k; C[s++] = C[x++], C[s++] = C[x++], C[s++] = C[x++], 2 < (w -= 3); )
                            ;
                          w && (C[s++] = C[x++], 1 < w && (C[s++] = C[x++]));
                        }
                        break;
                      }
                  }
                  break;
                }
            } while (n < i && s < o);
          n -= w = p >> 3, d &= (1 << (p -= w << 3)) - 1, e2.next_in = n, e2.next_out = s, e2.avail_in = n < i ? i - n + 5 : 5 - (n - i), e2.avail_out = s < o ? o - s + 257 : 257 - (s - o), r2.hold = d, r2.bits = p;
        };
      }, {}], 49: [function(e, t, r) {
        var I = e("../utils/common"), O = e("./adler32"), B = e("./crc32"), R = e("./inffast"), T = e("./inftrees"), D = 1, F = 2, N = 0, U = -2, P = 1, n = 852, i = 592;
        function L(e2) {
          return (e2 >>> 24 & 255) + (e2 >>> 8 & 65280) + ((65280 & e2) << 8) + ((255 & e2) << 24);
        }
        function s() {
          this.mode = 0, this.last = false, this.wrap = 0, this.havedict = false, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new I.Buf16(320), this.work = new I.Buf16(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
        }
        function a(e2) {
          var t2;
          return e2 && e2.state ? (t2 = e2.state, e2.total_in = e2.total_out = t2.total = 0, e2.msg = "", t2.wrap && (e2.adler = 1 & t2.wrap), t2.mode = P, t2.last = 0, t2.havedict = 0, t2.dmax = 32768, t2.head = null, t2.hold = 0, t2.bits = 0, t2.lencode = t2.lendyn = new I.Buf32(n), t2.distcode = t2.distdyn = new I.Buf32(i), t2.sane = 1, t2.back = -1, N) : U;
        }
        function o(e2) {
          var t2;
          return e2 && e2.state ? ((t2 = e2.state).wsize = 0, t2.whave = 0, t2.wnext = 0, a(e2)) : U;
        }
        function h(e2, t2) {
          var r2, n2;
          return e2 && e2.state ? (n2 = e2.state, t2 < 0 ? (r2 = 0, t2 = -t2) : (r2 = 1 + (t2 >> 4), t2 < 48 && (t2 &= 15)), t2 && (t2 < 8 || 15 < t2) ? U : (null !== n2.window && n2.wbits !== t2 && (n2.window = null), n2.wrap = r2, n2.wbits = t2, o(e2))) : U;
        }
        function u(e2, t2) {
          var r2, n2;
          return e2 ? (n2 = new s(), (e2.state = n2).window = null, (r2 = h(e2, t2)) !== N && (e2.state = null), r2) : U;
        }
        var l, f, c = true;
        function j(e2) {
          if (c) {
            var t2;
            for (l = new I.Buf32(512), f = new I.Buf32(32), t2 = 0; t2 < 144; )
              e2.lens[t2++] = 8;
            for (; t2 < 256; )
              e2.lens[t2++] = 9;
            for (; t2 < 280; )
              e2.lens[t2++] = 7;
            for (; t2 < 288; )
              e2.lens[t2++] = 8;
            for (T(D, e2.lens, 0, 288, l, 0, e2.work, { bits: 9 }), t2 = 0; t2 < 32; )
              e2.lens[t2++] = 5;
            T(F, e2.lens, 0, 32, f, 0, e2.work, { bits: 5 }), c = false;
          }
          e2.lencode = l, e2.lenbits = 9, e2.distcode = f, e2.distbits = 5;
        }
        function Z(e2, t2, r2, n2) {
          var i2, s2 = e2.state;
          return null === s2.window && (s2.wsize = 1 << s2.wbits, s2.wnext = 0, s2.whave = 0, s2.window = new I.Buf8(s2.wsize)), n2 >= s2.wsize ? (I.arraySet(s2.window, t2, r2 - s2.wsize, s2.wsize, 0), s2.wnext = 0, s2.whave = s2.wsize) : (n2 < (i2 = s2.wsize - s2.wnext) && (i2 = n2), I.arraySet(s2.window, t2, r2 - n2, i2, s2.wnext), (n2 -= i2) ? (I.arraySet(s2.window, t2, r2 - n2, n2, 0), s2.wnext = n2, s2.whave = s2.wsize) : (s2.wnext += i2, s2.wnext === s2.wsize && (s2.wnext = 0), s2.whave < s2.wsize && (s2.whave += i2))), 0;
        }
        r.inflateReset = o, r.inflateReset2 = h, r.inflateResetKeep = a, r.inflateInit = function(e2) {
          return u(e2, 15);
        }, r.inflateInit2 = u, r.inflate = function(e2, t2) {
          var r2, n2, i2, s2, a2, o2, h2, u2, l2, f2, c2, d, p, m, _2, g, b, v, y, w, k, x, S, z, C = 0, E = new I.Buf8(4), A = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
          if (!e2 || !e2.state || !e2.output || !e2.input && 0 !== e2.avail_in)
            return U;
          12 === (r2 = e2.state).mode && (r2.mode = 13), a2 = e2.next_out, i2 = e2.output, h2 = e2.avail_out, s2 = e2.next_in, n2 = e2.input, o2 = e2.avail_in, u2 = r2.hold, l2 = r2.bits, f2 = o2, c2 = h2, x = N;
          e:
            for (; ; )
              switch (r2.mode) {
                case P:
                  if (0 === r2.wrap) {
                    r2.mode = 13;
                    break;
                  }
                  for (; l2 < 16; ) {
                    if (0 === o2)
                      break e;
                    o2--, u2 += n2[s2++] << l2, l2 += 8;
                  }
                  if (2 & r2.wrap && 35615 === u2) {
                    E[r2.check = 0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0), l2 = u2 = 0, r2.mode = 2;
                    break;
                  }
                  if (r2.flags = 0, r2.head && (r2.head.done = false), !(1 & r2.wrap) || (((255 & u2) << 8) + (u2 >> 8)) % 31) {
                    e2.msg = "incorrect header check", r2.mode = 30;
                    break;
                  }
                  if (8 != (15 & u2)) {
                    e2.msg = "unknown compression method", r2.mode = 30;
                    break;
                  }
                  if (l2 -= 4, k = 8 + (15 & (u2 >>>= 4)), 0 === r2.wbits)
                    r2.wbits = k;
                  else if (k > r2.wbits) {
                    e2.msg = "invalid window size", r2.mode = 30;
                    break;
                  }
                  r2.dmax = 1 << k, e2.adler = r2.check = 1, r2.mode = 512 & u2 ? 10 : 12, l2 = u2 = 0;
                  break;
                case 2:
                  for (; l2 < 16; ) {
                    if (0 === o2)
                      break e;
                    o2--, u2 += n2[s2++] << l2, l2 += 8;
                  }
                  if (r2.flags = u2, 8 != (255 & r2.flags)) {
                    e2.msg = "unknown compression method", r2.mode = 30;
                    break;
                  }
                  if (57344 & r2.flags) {
                    e2.msg = "unknown header flags set", r2.mode = 30;
                    break;
                  }
                  r2.head && (r2.head.text = u2 >> 8 & 1), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0)), l2 = u2 = 0, r2.mode = 3;
                case 3:
                  for (; l2 < 32; ) {
                    if (0 === o2)
                      break e;
                    o2--, u2 += n2[s2++] << l2, l2 += 8;
                  }
                  r2.head && (r2.head.time = u2), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, E[2] = u2 >>> 16 & 255, E[3] = u2 >>> 24 & 255, r2.check = B(r2.check, E, 4, 0)), l2 = u2 = 0, r2.mode = 4;
                case 4:
                  for (; l2 < 16; ) {
                    if (0 === o2)
                      break e;
                    o2--, u2 += n2[s2++] << l2, l2 += 8;
                  }
                  r2.head && (r2.head.xflags = 255 & u2, r2.head.os = u2 >> 8), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0)), l2 = u2 = 0, r2.mode = 5;
                case 5:
                  if (1024 & r2.flags) {
                    for (; l2 < 16; ) {
                      if (0 === o2)
                        break e;
                      o2--, u2 += n2[s2++] << l2, l2 += 8;
                    }
                    r2.length = u2, r2.head && (r2.head.extra_len = u2), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0)), l2 = u2 = 0;
                  } else
                    r2.head && (r2.head.extra = null);
                  r2.mode = 6;
                case 6:
                  if (1024 & r2.flags && (o2 < (d = r2.length) && (d = o2), d && (r2.head && (k = r2.head.extra_len - r2.length, r2.head.extra || (r2.head.extra = new Array(r2.head.extra_len)), I.arraySet(r2.head.extra, n2, s2, d, k)), 512 & r2.flags && (r2.check = B(r2.check, n2, d, s2)), o2 -= d, s2 += d, r2.length -= d), r2.length))
                    break e;
                  r2.length = 0, r2.mode = 7;
                case 7:
                  if (2048 & r2.flags) {
                    if (0 === o2)
                      break e;
                    for (d = 0; k = n2[s2 + d++], r2.head && k && r2.length < 65536 && (r2.head.name += String.fromCharCode(k)), k && d < o2; )
                      ;
                    if (512 & r2.flags && (r2.check = B(r2.check, n2, d, s2)), o2 -= d, s2 += d, k)
                      break e;
                  } else
                    r2.head && (r2.head.name = null);
                  r2.length = 0, r2.mode = 8;
                case 8:
                  if (4096 & r2.flags) {
                    if (0 === o2)
                      break e;
                    for (d = 0; k = n2[s2 + d++], r2.head && k && r2.length < 65536 && (r2.head.comment += String.fromCharCode(k)), k && d < o2; )
                      ;
                    if (512 & r2.flags && (r2.check = B(r2.check, n2, d, s2)), o2 -= d, s2 += d, k)
                      break e;
                  } else
                    r2.head && (r2.head.comment = null);
                  r2.mode = 9;
                case 9:
                  if (512 & r2.flags) {
                    for (; l2 < 16; ) {
                      if (0 === o2)
                        break e;
                      o2--, u2 += n2[s2++] << l2, l2 += 8;
                    }
                    if (u2 !== (65535 & r2.check)) {
                      e2.msg = "header crc mismatch", r2.mode = 30;
                      break;
                    }
                    l2 = u2 = 0;
                  }
                  r2.head && (r2.head.hcrc = r2.flags >> 9 & 1, r2.head.done = true), e2.adler = r2.check = 0, r2.mode = 12;
                  break;
                case 10:
                  for (; l2 < 32; ) {
                    if (0 === o2)
                      break e;
                    o2--, u2 += n2[s2++] << l2, l2 += 8;
                  }
                  e2.adler = r2.check = L(u2), l2 = u2 = 0, r2.mode = 11;
                case 11:
                  if (0 === r2.havedict)
                    return e2.next_out = a2, e2.avail_out = h2, e2.next_in = s2, e2.avail_in = o2, r2.hold = u2, r2.bits = l2, 2;
                  e2.adler = r2.check = 1, r2.mode = 12;
                case 12:
                  if (5 === t2 || 6 === t2)
                    break e;
                case 13:
                  if (r2.last) {
                    u2 >>>= 7 & l2, l2 -= 7 & l2, r2.mode = 27;
                    break;
                  }
                  for (; l2 < 3; ) {
                    if (0 === o2)
                      break e;
                    o2--, u2 += n2[s2++] << l2, l2 += 8;
                  }
                  switch (r2.last = 1 & u2, l2 -= 1, 3 & (u2 >>>= 1)) {
                    case 0:
                      r2.mode = 14;
                      break;
                    case 1:
                      if (j(r2), r2.mode = 20, 6 !== t2)
                        break;
                      u2 >>>= 2, l2 -= 2;
                      break e;
                    case 2:
                      r2.mode = 17;
                      break;
                    case 3:
                      e2.msg = "invalid block type", r2.mode = 30;
                  }
                  u2 >>>= 2, l2 -= 2;
                  break;
                case 14:
                  for (u2 >>>= 7 & l2, l2 -= 7 & l2; l2 < 32; ) {
                    if (0 === o2)
                      break e;
                    o2--, u2 += n2[s2++] << l2, l2 += 8;
                  }
                  if ((65535 & u2) != (u2 >>> 16 ^ 65535)) {
                    e2.msg = "invalid stored block lengths", r2.mode = 30;
                    break;
                  }
                  if (r2.length = 65535 & u2, l2 = u2 = 0, r2.mode = 15, 6 === t2)
                    break e;
                case 15:
                  r2.mode = 16;
                case 16:
                  if (d = r2.length) {
                    if (o2 < d && (d = o2), h2 < d && (d = h2), 0 === d)
                      break e;
                    I.arraySet(i2, n2, s2, d, a2), o2 -= d, s2 += d, h2 -= d, a2 += d, r2.length -= d;
                    break;
                  }
                  r2.mode = 12;
                  break;
                case 17:
                  for (; l2 < 14; ) {
                    if (0 === o2)
                      break e;
                    o2--, u2 += n2[s2++] << l2, l2 += 8;
                  }
                  if (r2.nlen = 257 + (31 & u2), u2 >>>= 5, l2 -= 5, r2.ndist = 1 + (31 & u2), u2 >>>= 5, l2 -= 5, r2.ncode = 4 + (15 & u2), u2 >>>= 4, l2 -= 4, 286 < r2.nlen || 30 < r2.ndist) {
                    e2.msg = "too many length or distance symbols", r2.mode = 30;
                    break;
                  }
                  r2.have = 0, r2.mode = 18;
                case 18:
                  for (; r2.have < r2.ncode; ) {
                    for (; l2 < 3; ) {
                      if (0 === o2)
                        break e;
                      o2--, u2 += n2[s2++] << l2, l2 += 8;
                    }
                    r2.lens[A[r2.have++]] = 7 & u2, u2 >>>= 3, l2 -= 3;
                  }
                  for (; r2.have < 19; )
                    r2.lens[A[r2.have++]] = 0;
                  if (r2.lencode = r2.lendyn, r2.lenbits = 7, S = { bits: r2.lenbits }, x = T(0, r2.lens, 0, 19, r2.lencode, 0, r2.work, S), r2.lenbits = S.bits, x) {
                    e2.msg = "invalid code lengths set", r2.mode = 30;
                    break;
                  }
                  r2.have = 0, r2.mode = 19;
                case 19:
                  for (; r2.have < r2.nlen + r2.ndist; ) {
                    for (; g = (C = r2.lencode[u2 & (1 << r2.lenbits) - 1]) >>> 16 & 255, b = 65535 & C, !((_2 = C >>> 24) <= l2); ) {
                      if (0 === o2)
                        break e;
                      o2--, u2 += n2[s2++] << l2, l2 += 8;
                    }
                    if (b < 16)
                      u2 >>>= _2, l2 -= _2, r2.lens[r2.have++] = b;
                    else {
                      if (16 === b) {
                        for (z = _2 + 2; l2 < z; ) {
                          if (0 === o2)
                            break e;
                          o2--, u2 += n2[s2++] << l2, l2 += 8;
                        }
                        if (u2 >>>= _2, l2 -= _2, 0 === r2.have) {
                          e2.msg = "invalid bit length repeat", r2.mode = 30;
                          break;
                        }
                        k = r2.lens[r2.have - 1], d = 3 + (3 & u2), u2 >>>= 2, l2 -= 2;
                      } else if (17 === b) {
                        for (z = _2 + 3; l2 < z; ) {
                          if (0 === o2)
                            break e;
                          o2--, u2 += n2[s2++] << l2, l2 += 8;
                        }
                        l2 -= _2, k = 0, d = 3 + (7 & (u2 >>>= _2)), u2 >>>= 3, l2 -= 3;
                      } else {
                        for (z = _2 + 7; l2 < z; ) {
                          if (0 === o2)
                            break e;
                          o2--, u2 += n2[s2++] << l2, l2 += 8;
                        }
                        l2 -= _2, k = 0, d = 11 + (127 & (u2 >>>= _2)), u2 >>>= 7, l2 -= 7;
                      }
                      if (r2.have + d > r2.nlen + r2.ndist) {
                        e2.msg = "invalid bit length repeat", r2.mode = 30;
                        break;
                      }
                      for (; d--; )
                        r2.lens[r2.have++] = k;
                    }
                  }
                  if (30 === r2.mode)
                    break;
                  if (0 === r2.lens[256]) {
                    e2.msg = "invalid code -- missing end-of-block", r2.mode = 30;
                    break;
                  }
                  if (r2.lenbits = 9, S = { bits: r2.lenbits }, x = T(D, r2.lens, 0, r2.nlen, r2.lencode, 0, r2.work, S), r2.lenbits = S.bits, x) {
                    e2.msg = "invalid literal/lengths set", r2.mode = 30;
                    break;
                  }
                  if (r2.distbits = 6, r2.distcode = r2.distdyn, S = { bits: r2.distbits }, x = T(F, r2.lens, r2.nlen, r2.ndist, r2.distcode, 0, r2.work, S), r2.distbits = S.bits, x) {
                    e2.msg = "invalid distances set", r2.mode = 30;
                    break;
                  }
                  if (r2.mode = 20, 6 === t2)
                    break e;
                case 20:
                  r2.mode = 21;
                case 21:
                  if (6 <= o2 && 258 <= h2) {
                    e2.next_out = a2, e2.avail_out = h2, e2.next_in = s2, e2.avail_in = o2, r2.hold = u2, r2.bits = l2, R(e2, c2), a2 = e2.next_out, i2 = e2.output, h2 = e2.avail_out, s2 = e2.next_in, n2 = e2.input, o2 = e2.avail_in, u2 = r2.hold, l2 = r2.bits, 12 === r2.mode && (r2.back = -1);
                    break;
                  }
                  for (r2.back = 0; g = (C = r2.lencode[u2 & (1 << r2.lenbits) - 1]) >>> 16 & 255, b = 65535 & C, !((_2 = C >>> 24) <= l2); ) {
                    if (0 === o2)
                      break e;
                    o2--, u2 += n2[s2++] << l2, l2 += 8;
                  }
                  if (g && 0 == (240 & g)) {
                    for (v = _2, y = g, w = b; g = (C = r2.lencode[w + ((u2 & (1 << v + y) - 1) >> v)]) >>> 16 & 255, b = 65535 & C, !(v + (_2 = C >>> 24) <= l2); ) {
                      if (0 === o2)
                        break e;
                      o2--, u2 += n2[s2++] << l2, l2 += 8;
                    }
                    u2 >>>= v, l2 -= v, r2.back += v;
                  }
                  if (u2 >>>= _2, l2 -= _2, r2.back += _2, r2.length = b, 0 === g) {
                    r2.mode = 26;
                    break;
                  }
                  if (32 & g) {
                    r2.back = -1, r2.mode = 12;
                    break;
                  }
                  if (64 & g) {
                    e2.msg = "invalid literal/length code", r2.mode = 30;
                    break;
                  }
                  r2.extra = 15 & g, r2.mode = 22;
                case 22:
                  if (r2.extra) {
                    for (z = r2.extra; l2 < z; ) {
                      if (0 === o2)
                        break e;
                      o2--, u2 += n2[s2++] << l2, l2 += 8;
                    }
                    r2.length += u2 & (1 << r2.extra) - 1, u2 >>>= r2.extra, l2 -= r2.extra, r2.back += r2.extra;
                  }
                  r2.was = r2.length, r2.mode = 23;
                case 23:
                  for (; g = (C = r2.distcode[u2 & (1 << r2.distbits) - 1]) >>> 16 & 255, b = 65535 & C, !((_2 = C >>> 24) <= l2); ) {
                    if (0 === o2)
                      break e;
                    o2--, u2 += n2[s2++] << l2, l2 += 8;
                  }
                  if (0 == (240 & g)) {
                    for (v = _2, y = g, w = b; g = (C = r2.distcode[w + ((u2 & (1 << v + y) - 1) >> v)]) >>> 16 & 255, b = 65535 & C, !(v + (_2 = C >>> 24) <= l2); ) {
                      if (0 === o2)
                        break e;
                      o2--, u2 += n2[s2++] << l2, l2 += 8;
                    }
                    u2 >>>= v, l2 -= v, r2.back += v;
                  }
                  if (u2 >>>= _2, l2 -= _2, r2.back += _2, 64 & g) {
                    e2.msg = "invalid distance code", r2.mode = 30;
                    break;
                  }
                  r2.offset = b, r2.extra = 15 & g, r2.mode = 24;
                case 24:
                  if (r2.extra) {
                    for (z = r2.extra; l2 < z; ) {
                      if (0 === o2)
                        break e;
                      o2--, u2 += n2[s2++] << l2, l2 += 8;
                    }
                    r2.offset += u2 & (1 << r2.extra) - 1, u2 >>>= r2.extra, l2 -= r2.extra, r2.back += r2.extra;
                  }
                  if (r2.offset > r2.dmax) {
                    e2.msg = "invalid distance too far back", r2.mode = 30;
                    break;
                  }
                  r2.mode = 25;
                case 25:
                  if (0 === h2)
                    break e;
                  if (d = c2 - h2, r2.offset > d) {
                    if ((d = r2.offset - d) > r2.whave && r2.sane) {
                      e2.msg = "invalid distance too far back", r2.mode = 30;
                      break;
                    }
                    p = d > r2.wnext ? (d -= r2.wnext, r2.wsize - d) : r2.wnext - d, d > r2.length && (d = r2.length), m = r2.window;
                  } else
                    m = i2, p = a2 - r2.offset, d = r2.length;
                  for (h2 < d && (d = h2), h2 -= d, r2.length -= d; i2[a2++] = m[p++], --d; )
                    ;
                  0 === r2.length && (r2.mode = 21);
                  break;
                case 26:
                  if (0 === h2)
                    break e;
                  i2[a2++] = r2.length, h2--, r2.mode = 21;
                  break;
                case 27:
                  if (r2.wrap) {
                    for (; l2 < 32; ) {
                      if (0 === o2)
                        break e;
                      o2--, u2 |= n2[s2++] << l2, l2 += 8;
                    }
                    if (c2 -= h2, e2.total_out += c2, r2.total += c2, c2 && (e2.adler = r2.check = r2.flags ? B(r2.check, i2, c2, a2 - c2) : O(r2.check, i2, c2, a2 - c2)), c2 = h2, (r2.flags ? u2 : L(u2)) !== r2.check) {
                      e2.msg = "incorrect data check", r2.mode = 30;
                      break;
                    }
                    l2 = u2 = 0;
                  }
                  r2.mode = 28;
                case 28:
                  if (r2.wrap && r2.flags) {
                    for (; l2 < 32; ) {
                      if (0 === o2)
                        break e;
                      o2--, u2 += n2[s2++] << l2, l2 += 8;
                    }
                    if (u2 !== (4294967295 & r2.total)) {
                      e2.msg = "incorrect length check", r2.mode = 30;
                      break;
                    }
                    l2 = u2 = 0;
                  }
                  r2.mode = 29;
                case 29:
                  x = 1;
                  break e;
                case 30:
                  x = -3;
                  break e;
                case 31:
                  return -4;
                case 32:
                default:
                  return U;
              }
          return e2.next_out = a2, e2.avail_out = h2, e2.next_in = s2, e2.avail_in = o2, r2.hold = u2, r2.bits = l2, (r2.wsize || c2 !== e2.avail_out && r2.mode < 30 && (r2.mode < 27 || 4 !== t2)) && Z(e2, e2.output, e2.next_out, c2 - e2.avail_out) ? (r2.mode = 31, -4) : (f2 -= e2.avail_in, c2 -= e2.avail_out, e2.total_in += f2, e2.total_out += c2, r2.total += c2, r2.wrap && c2 && (e2.adler = r2.check = r2.flags ? B(r2.check, i2, c2, e2.next_out - c2) : O(r2.check, i2, c2, e2.next_out - c2)), e2.data_type = r2.bits + (r2.last ? 64 : 0) + (12 === r2.mode ? 128 : 0) + (20 === r2.mode || 15 === r2.mode ? 256 : 0), (0 == f2 && 0 === c2 || 4 === t2) && x === N && (x = -5), x);
        }, r.inflateEnd = function(e2) {
          if (!e2 || !e2.state)
            return U;
          var t2 = e2.state;
          return t2.window && (t2.window = null), e2.state = null, N;
        }, r.inflateGetHeader = function(e2, t2) {
          var r2;
          return e2 && e2.state ? 0 == (2 & (r2 = e2.state).wrap) ? U : ((r2.head = t2).done = false, N) : U;
        }, r.inflateSetDictionary = function(e2, t2) {
          var r2, n2 = t2.length;
          return e2 && e2.state ? 0 !== (r2 = e2.state).wrap && 11 !== r2.mode ? U : 11 === r2.mode && O(1, t2, n2, 0) !== r2.check ? -3 : Z(e2, t2, n2, n2) ? (r2.mode = 31, -4) : (r2.havedict = 1, N) : U;
        }, r.inflateInfo = "pako inflate (from Nodeca project)";
      }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./inffast": 48, "./inftrees": 50 }], 50: [function(e, t, r) {
        var D = e("../utils/common"), F = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0], N = [16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78], U = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 0, 0], P = [16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64];
        t.exports = function(e2, t2, r2, n, i, s, a, o) {
          var h, u, l, f, c, d, p, m, _2, g = o.bits, b = 0, v = 0, y = 0, w = 0, k = 0, x = 0, S = 0, z = 0, C = 0, E = 0, A = null, I = 0, O = new D.Buf16(16), B = new D.Buf16(16), R = null, T = 0;
          for (b = 0; b <= 15; b++)
            O[b] = 0;
          for (v = 0; v < n; v++)
            O[t2[r2 + v]]++;
          for (k = g, w = 15; 1 <= w && 0 === O[w]; w--)
            ;
          if (w < k && (k = w), 0 === w)
            return i[s++] = 20971520, i[s++] = 20971520, o.bits = 1, 0;
          for (y = 1; y < w && 0 === O[y]; y++)
            ;
          for (k < y && (k = y), b = z = 1; b <= 15; b++)
            if (z <<= 1, (z -= O[b]) < 0)
              return -1;
          if (0 < z && (0 === e2 || 1 !== w))
            return -1;
          for (B[1] = 0, b = 1; b < 15; b++)
            B[b + 1] = B[b] + O[b];
          for (v = 0; v < n; v++)
            0 !== t2[r2 + v] && (a[B[t2[r2 + v]]++] = v);
          if (d = 0 === e2 ? (A = R = a, 19) : 1 === e2 ? (A = F, I -= 257, R = N, T -= 257, 256) : (A = U, R = P, -1), b = y, c = s, S = v = E = 0, l = -1, f = (C = 1 << (x = k)) - 1, 1 === e2 && 852 < C || 2 === e2 && 592 < C)
            return 1;
          for (; ; ) {
            for (p = b - S, _2 = a[v] < d ? (m = 0, a[v]) : a[v] > d ? (m = R[T + a[v]], A[I + a[v]]) : (m = 96, 0), h = 1 << b - S, y = u = 1 << x; i[c + (E >> S) + (u -= h)] = p << 24 | m << 16 | _2 | 0, 0 !== u; )
              ;
            for (h = 1 << b - 1; E & h; )
              h >>= 1;
            if (0 !== h ? (E &= h - 1, E += h) : E = 0, v++, 0 == --O[b]) {
              if (b === w)
                break;
              b = t2[r2 + a[v]];
            }
            if (k < b && (E & f) !== l) {
              for (0 === S && (S = k), c += y, z = 1 << (x = b - S); x + S < w && !((z -= O[x + S]) <= 0); )
                x++, z <<= 1;
              if (C += 1 << x, 1 === e2 && 852 < C || 2 === e2 && 592 < C)
                return 1;
              i[l = E & f] = k << 24 | x << 16 | c - s | 0;
            }
          }
          return 0 !== E && (i[c + E] = b - S << 24 | 64 << 16 | 0), o.bits = k, 0;
        };
      }, { "../utils/common": 41 }], 51: [function(e, t, r) {
        t.exports = { 2: "need dictionary", 1: "stream end", 0: "", "-1": "file error", "-2": "stream error", "-3": "data error", "-4": "insufficient memory", "-5": "buffer error", "-6": "incompatible version" };
      }, {}], 52: [function(e, t, r) {
        var i = e("../utils/common"), o = 0, h = 1;
        function n(e2) {
          for (var t2 = e2.length; 0 <= --t2; )
            e2[t2] = 0;
        }
        var s = 0, a = 29, u = 256, l = u + 1 + a, f = 30, c = 19, _2 = 2 * l + 1, g = 15, d = 16, p = 7, m = 256, b = 16, v = 17, y = 18, w = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0], k = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13], x = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7], S = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15], z = new Array(2 * (l + 2));
        n(z);
        var C = new Array(2 * f);
        n(C);
        var E = new Array(512);
        n(E);
        var A = new Array(256);
        n(A);
        var I = new Array(a);
        n(I);
        var O, B, R, T = new Array(f);
        function D(e2, t2, r2, n2, i2) {
          this.static_tree = e2, this.extra_bits = t2, this.extra_base = r2, this.elems = n2, this.max_length = i2, this.has_stree = e2 && e2.length;
        }
        function F(e2, t2) {
          this.dyn_tree = e2, this.max_code = 0, this.stat_desc = t2;
        }
        function N(e2) {
          return e2 < 256 ? E[e2] : E[256 + (e2 >>> 7)];
        }
        function U(e2, t2) {
          e2.pending_buf[e2.pending++] = 255 & t2, e2.pending_buf[e2.pending++] = t2 >>> 8 & 255;
        }
        function P(e2, t2, r2) {
          e2.bi_valid > d - r2 ? (e2.bi_buf |= t2 << e2.bi_valid & 65535, U(e2, e2.bi_buf), e2.bi_buf = t2 >> d - e2.bi_valid, e2.bi_valid += r2 - d) : (e2.bi_buf |= t2 << e2.bi_valid & 65535, e2.bi_valid += r2);
        }
        function L(e2, t2, r2) {
          P(e2, r2[2 * t2], r2[2 * t2 + 1]);
        }
        function j(e2, t2) {
          for (var r2 = 0; r2 |= 1 & e2, e2 >>>= 1, r2 <<= 1, 0 < --t2; )
            ;
          return r2 >>> 1;
        }
        function Z(e2, t2, r2) {
          var n2, i2, s2 = new Array(g + 1), a2 = 0;
          for (n2 = 1; n2 <= g; n2++)
            s2[n2] = a2 = a2 + r2[n2 - 1] << 1;
          for (i2 = 0; i2 <= t2; i2++) {
            var o2 = e2[2 * i2 + 1];
            0 !== o2 && (e2[2 * i2] = j(s2[o2]++, o2));
          }
        }
        function W(e2) {
          var t2;
          for (t2 = 0; t2 < l; t2++)
            e2.dyn_ltree[2 * t2] = 0;
          for (t2 = 0; t2 < f; t2++)
            e2.dyn_dtree[2 * t2] = 0;
          for (t2 = 0; t2 < c; t2++)
            e2.bl_tree[2 * t2] = 0;
          e2.dyn_ltree[2 * m] = 1, e2.opt_len = e2.static_len = 0, e2.last_lit = e2.matches = 0;
        }
        function M(e2) {
          8 < e2.bi_valid ? U(e2, e2.bi_buf) : 0 < e2.bi_valid && (e2.pending_buf[e2.pending++] = e2.bi_buf), e2.bi_buf = 0, e2.bi_valid = 0;
        }
        function H(e2, t2, r2, n2) {
          var i2 = 2 * t2, s2 = 2 * r2;
          return e2[i2] < e2[s2] || e2[i2] === e2[s2] && n2[t2] <= n2[r2];
        }
        function G(e2, t2, r2) {
          for (var n2 = e2.heap[r2], i2 = r2 << 1; i2 <= e2.heap_len && (i2 < e2.heap_len && H(t2, e2.heap[i2 + 1], e2.heap[i2], e2.depth) && i2++, !H(t2, n2, e2.heap[i2], e2.depth)); )
            e2.heap[r2] = e2.heap[i2], r2 = i2, i2 <<= 1;
          e2.heap[r2] = n2;
        }
        function K(e2, t2, r2) {
          var n2, i2, s2, a2, o2 = 0;
          if (0 !== e2.last_lit)
            for (; n2 = e2.pending_buf[e2.d_buf + 2 * o2] << 8 | e2.pending_buf[e2.d_buf + 2 * o2 + 1], i2 = e2.pending_buf[e2.l_buf + o2], o2++, 0 === n2 ? L(e2, i2, t2) : (L(e2, (s2 = A[i2]) + u + 1, t2), 0 !== (a2 = w[s2]) && P(e2, i2 -= I[s2], a2), L(e2, s2 = N(--n2), r2), 0 !== (a2 = k[s2]) && P(e2, n2 -= T[s2], a2)), o2 < e2.last_lit; )
              ;
          L(e2, m, t2);
        }
        function Y(e2, t2) {
          var r2, n2, i2, s2 = t2.dyn_tree, a2 = t2.stat_desc.static_tree, o2 = t2.stat_desc.has_stree, h2 = t2.stat_desc.elems, u2 = -1;
          for (e2.heap_len = 0, e2.heap_max = _2, r2 = 0; r2 < h2; r2++)
            0 !== s2[2 * r2] ? (e2.heap[++e2.heap_len] = u2 = r2, e2.depth[r2] = 0) : s2[2 * r2 + 1] = 0;
          for (; e2.heap_len < 2; )
            s2[2 * (i2 = e2.heap[++e2.heap_len] = u2 < 2 ? ++u2 : 0)] = 1, e2.depth[i2] = 0, e2.opt_len--, o2 && (e2.static_len -= a2[2 * i2 + 1]);
          for (t2.max_code = u2, r2 = e2.heap_len >> 1; 1 <= r2; r2--)
            G(e2, s2, r2);
          for (i2 = h2; r2 = e2.heap[1], e2.heap[1] = e2.heap[e2.heap_len--], G(e2, s2, 1), n2 = e2.heap[1], e2.heap[--e2.heap_max] = r2, e2.heap[--e2.heap_max] = n2, s2[2 * i2] = s2[2 * r2] + s2[2 * n2], e2.depth[i2] = (e2.depth[r2] >= e2.depth[n2] ? e2.depth[r2] : e2.depth[n2]) + 1, s2[2 * r2 + 1] = s2[2 * n2 + 1] = i2, e2.heap[1] = i2++, G(e2, s2, 1), 2 <= e2.heap_len; )
            ;
          e2.heap[--e2.heap_max] = e2.heap[1], function(e3, t3) {
            var r3, n3, i3, s3, a3, o3, h3 = t3.dyn_tree, u3 = t3.max_code, l2 = t3.stat_desc.static_tree, f2 = t3.stat_desc.has_stree, c2 = t3.stat_desc.extra_bits, d2 = t3.stat_desc.extra_base, p2 = t3.stat_desc.max_length, m2 = 0;
            for (s3 = 0; s3 <= g; s3++)
              e3.bl_count[s3] = 0;
            for (h3[2 * e3.heap[e3.heap_max] + 1] = 0, r3 = e3.heap_max + 1; r3 < _2; r3++)
              p2 < (s3 = h3[2 * h3[2 * (n3 = e3.heap[r3]) + 1] + 1] + 1) && (s3 = p2, m2++), h3[2 * n3 + 1] = s3, u3 < n3 || (e3.bl_count[s3]++, a3 = 0, d2 <= n3 && (a3 = c2[n3 - d2]), o3 = h3[2 * n3], e3.opt_len += o3 * (s3 + a3), f2 && (e3.static_len += o3 * (l2[2 * n3 + 1] + a3)));
            if (0 !== m2) {
              do {
                for (s3 = p2 - 1; 0 === e3.bl_count[s3]; )
                  s3--;
                e3.bl_count[s3]--, e3.bl_count[s3 + 1] += 2, e3.bl_count[p2]--, m2 -= 2;
              } while (0 < m2);
              for (s3 = p2; 0 !== s3; s3--)
                for (n3 = e3.bl_count[s3]; 0 !== n3; )
                  u3 < (i3 = e3.heap[--r3]) || (h3[2 * i3 + 1] !== s3 && (e3.opt_len += (s3 - h3[2 * i3 + 1]) * h3[2 * i3], h3[2 * i3 + 1] = s3), n3--);
            }
          }(e2, t2), Z(s2, u2, e2.bl_count);
        }
        function X(e2, t2, r2) {
          var n2, i2, s2 = -1, a2 = t2[1], o2 = 0, h2 = 7, u2 = 4;
          for (0 === a2 && (h2 = 138, u2 = 3), t2[2 * (r2 + 1) + 1] = 65535, n2 = 0; n2 <= r2; n2++)
            i2 = a2, a2 = t2[2 * (n2 + 1) + 1], ++o2 < h2 && i2 === a2 || (o2 < u2 ? e2.bl_tree[2 * i2] += o2 : 0 !== i2 ? (i2 !== s2 && e2.bl_tree[2 * i2]++, e2.bl_tree[2 * b]++) : o2 <= 10 ? e2.bl_tree[2 * v]++ : e2.bl_tree[2 * y]++, s2 = i2, u2 = (o2 = 0) === a2 ? (h2 = 138, 3) : i2 === a2 ? (h2 = 6, 3) : (h2 = 7, 4));
        }
        function V(e2, t2, r2) {
          var n2, i2, s2 = -1, a2 = t2[1], o2 = 0, h2 = 7, u2 = 4;
          for (0 === a2 && (h2 = 138, u2 = 3), n2 = 0; n2 <= r2; n2++)
            if (i2 = a2, a2 = t2[2 * (n2 + 1) + 1], !(++o2 < h2 && i2 === a2)) {
              if (o2 < u2)
                for (; L(e2, i2, e2.bl_tree), 0 != --o2; )
                  ;
              else
                0 !== i2 ? (i2 !== s2 && (L(e2, i2, e2.bl_tree), o2--), L(e2, b, e2.bl_tree), P(e2, o2 - 3, 2)) : o2 <= 10 ? (L(e2, v, e2.bl_tree), P(e2, o2 - 3, 3)) : (L(e2, y, e2.bl_tree), P(e2, o2 - 11, 7));
              s2 = i2, u2 = (o2 = 0) === a2 ? (h2 = 138, 3) : i2 === a2 ? (h2 = 6, 3) : (h2 = 7, 4);
            }
        }
        n(T);
        var q = false;
        function J(e2, t2, r2, n2) {
          P(e2, (s << 1) + (n2 ? 1 : 0), 3), function(e3, t3, r3, n3) {
            M(e3), n3 && (U(e3, r3), U(e3, ~r3)), i.arraySet(e3.pending_buf, e3.window, t3, r3, e3.pending), e3.pending += r3;
          }(e2, t2, r2, true);
        }
        r._tr_init = function(e2) {
          q || (function() {
            var e3, t2, r2, n2, i2, s2 = new Array(g + 1);
            for (n2 = r2 = 0; n2 < a - 1; n2++)
              for (I[n2] = r2, e3 = 0; e3 < 1 << w[n2]; e3++)
                A[r2++] = n2;
            for (A[r2 - 1] = n2, n2 = i2 = 0; n2 < 16; n2++)
              for (T[n2] = i2, e3 = 0; e3 < 1 << k[n2]; e3++)
                E[i2++] = n2;
            for (i2 >>= 7; n2 < f; n2++)
              for (T[n2] = i2 << 7, e3 = 0; e3 < 1 << k[n2] - 7; e3++)
                E[256 + i2++] = n2;
            for (t2 = 0; t2 <= g; t2++)
              s2[t2] = 0;
            for (e3 = 0; e3 <= 143; )
              z[2 * e3 + 1] = 8, e3++, s2[8]++;
            for (; e3 <= 255; )
              z[2 * e3 + 1] = 9, e3++, s2[9]++;
            for (; e3 <= 279; )
              z[2 * e3 + 1] = 7, e3++, s2[7]++;
            for (; e3 <= 287; )
              z[2 * e3 + 1] = 8, e3++, s2[8]++;
            for (Z(z, l + 1, s2), e3 = 0; e3 < f; e3++)
              C[2 * e3 + 1] = 5, C[2 * e3] = j(e3, 5);
            O = new D(z, w, u + 1, l, g), B = new D(C, k, 0, f, g), R = new D(new Array(0), x, 0, c, p);
          }(), q = true), e2.l_desc = new F(e2.dyn_ltree, O), e2.d_desc = new F(e2.dyn_dtree, B), e2.bl_desc = new F(e2.bl_tree, R), e2.bi_buf = 0, e2.bi_valid = 0, W(e2);
        }, r._tr_stored_block = J, r._tr_flush_block = function(e2, t2, r2, n2) {
          var i2, s2, a2 = 0;
          0 < e2.level ? (2 === e2.strm.data_type && (e2.strm.data_type = function(e3) {
            var t3, r3 = 4093624447;
            for (t3 = 0; t3 <= 31; t3++, r3 >>>= 1)
              if (1 & r3 && 0 !== e3.dyn_ltree[2 * t3])
                return o;
            if (0 !== e3.dyn_ltree[18] || 0 !== e3.dyn_ltree[20] || 0 !== e3.dyn_ltree[26])
              return h;
            for (t3 = 32; t3 < u; t3++)
              if (0 !== e3.dyn_ltree[2 * t3])
                return h;
            return o;
          }(e2)), Y(e2, e2.l_desc), Y(e2, e2.d_desc), a2 = function(e3) {
            var t3;
            for (X(e3, e3.dyn_ltree, e3.l_desc.max_code), X(e3, e3.dyn_dtree, e3.d_desc.max_code), Y(e3, e3.bl_desc), t3 = c - 1; 3 <= t3 && 0 === e3.bl_tree[2 * S[t3] + 1]; t3--)
              ;
            return e3.opt_len += 3 * (t3 + 1) + 5 + 5 + 4, t3;
          }(e2), i2 = e2.opt_len + 3 + 7 >>> 3, (s2 = e2.static_len + 3 + 7 >>> 3) <= i2 && (i2 = s2)) : i2 = s2 = r2 + 5, r2 + 4 <= i2 && -1 !== t2 ? J(e2, t2, r2, n2) : 4 === e2.strategy || s2 === i2 ? (P(e2, 2 + (n2 ? 1 : 0), 3), K(e2, z, C)) : (P(e2, 4 + (n2 ? 1 : 0), 3), function(e3, t3, r3, n3) {
            var i3;
            for (P(e3, t3 - 257, 5), P(e3, r3 - 1, 5), P(e3, n3 - 4, 4), i3 = 0; i3 < n3; i3++)
              P(e3, e3.bl_tree[2 * S[i3] + 1], 3);
            V(e3, e3.dyn_ltree, t3 - 1), V(e3, e3.dyn_dtree, r3 - 1);
          }(e2, e2.l_desc.max_code + 1, e2.d_desc.max_code + 1, a2 + 1), K(e2, e2.dyn_ltree, e2.dyn_dtree)), W(e2), n2 && M(e2);
        }, r._tr_tally = function(e2, t2, r2) {
          return e2.pending_buf[e2.d_buf + 2 * e2.last_lit] = t2 >>> 8 & 255, e2.pending_buf[e2.d_buf + 2 * e2.last_lit + 1] = 255 & t2, e2.pending_buf[e2.l_buf + e2.last_lit] = 255 & r2, e2.last_lit++, 0 === t2 ? e2.dyn_ltree[2 * r2]++ : (e2.matches++, t2--, e2.dyn_ltree[2 * (A[r2] + u + 1)]++, e2.dyn_dtree[2 * N(t2)]++), e2.last_lit === e2.lit_bufsize - 1;
        }, r._tr_align = function(e2) {
          P(e2, 2, 3), L(e2, m, z), function(e3) {
            16 === e3.bi_valid ? (U(e3, e3.bi_buf), e3.bi_buf = 0, e3.bi_valid = 0) : 8 <= e3.bi_valid && (e3.pending_buf[e3.pending++] = 255 & e3.bi_buf, e3.bi_buf >>= 8, e3.bi_valid -= 8);
          }(e2);
        };
      }, { "../utils/common": 41 }], 53: [function(e, t, r) {
        t.exports = function() {
          this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
        };
      }, {}], 54: [function(e, t, r) {
        (function(e2) {
          !function(r2, n) {
            if (!r2.setImmediate) {
              var i, s, t2, a, o = 1, h = {}, u = false, l = r2.document, e3 = Object.getPrototypeOf && Object.getPrototypeOf(r2);
              e3 = e3 && e3.setTimeout ? e3 : r2, i = "[object process]" === {}.toString.call(r2.process) ? function(e4) {
                process.nextTick(function() {
                  c(e4);
                });
              } : function() {
                if (r2.postMessage && !r2.importScripts) {
                  var e4 = true, t3 = r2.onmessage;
                  return r2.onmessage = function() {
                    e4 = false;
                  }, r2.postMessage("", "*"), r2.onmessage = t3, e4;
                }
              }() ? (a = "setImmediate$" + Math.random() + "$", r2.addEventListener ? r2.addEventListener("message", d, false) : r2.attachEvent("onmessage", d), function(e4) {
                r2.postMessage(a + e4, "*");
              }) : r2.MessageChannel ? ((t2 = new MessageChannel()).port1.onmessage = function(e4) {
                c(e4.data);
              }, function(e4) {
                t2.port2.postMessage(e4);
              }) : l && "onreadystatechange" in l.createElement("script") ? (s = l.documentElement, function(e4) {
                var t3 = l.createElement("script");
                t3.onreadystatechange = function() {
                  c(e4), t3.onreadystatechange = null, s.removeChild(t3), t3 = null;
                }, s.appendChild(t3);
              }) : function(e4) {
                setTimeout(c, 0, e4);
              }, e3.setImmediate = function(e4) {
                "function" != typeof e4 && (e4 = new Function("" + e4));
                for (var t3 = new Array(arguments.length - 1), r3 = 0; r3 < t3.length; r3++)
                  t3[r3] = arguments[r3 + 1];
                var n2 = { callback: e4, args: t3 };
                return h[o] = n2, i(o), o++;
              }, e3.clearImmediate = f;
            }
            function f(e4) {
              delete h[e4];
            }
            function c(e4) {
              if (u)
                setTimeout(c, 0, e4);
              else {
                var t3 = h[e4];
                if (t3) {
                  u = true;
                  try {
                    !function(e5) {
                      var t4 = e5.callback, r3 = e5.args;
                      switch (r3.length) {
                        case 0:
                          t4();
                          break;
                        case 1:
                          t4(r3[0]);
                          break;
                        case 2:
                          t4(r3[0], r3[1]);
                          break;
                        case 3:
                          t4(r3[0], r3[1], r3[2]);
                          break;
                        default:
                          t4.apply(n, r3);
                      }
                    }(t3);
                  } finally {
                    f(e4), u = false;
                  }
                }
              }
            }
            function d(e4) {
              e4.source === r2 && "string" == typeof e4.data && 0 === e4.data.indexOf(a) && c(+e4.data.slice(a.length));
            }
          }("undefined" == typeof self ? void 0 === e2 ? this : e2 : self);
        }).call(this, "undefined" != typeof commonjsGlobal ? commonjsGlobal : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {});
      }, {}] }, {}, [10])(10);
    });
  })(jszip_min);
  const jsZipCompatibleMimeTypes = [`application/epub+zip`, `application/x-cbz`];
  const getArchiveForFile = async (file) => {
    const normalizedName = file.name.toLowerCase();
    if (normalizedName.endsWith(`.epub`) || normalizedName.endsWith(`.cbz`) || jsZipCompatibleMimeTypes.includes(file.data.type)) {
      const jszip = await jszip_minExports.loadAsync(file.data);
      return dist.createArchiveFromJszip(jszip, {
        orderByAlpha: true,
        name: file.name
      });
    }
    if (normalizedName.endsWith(`.txt`)) {
      return dist.createArchiveFromText(file.data);
    }
    return void 0;
  };
  class FileNotFoundError extends Error {
  }
  class FileNotSupportedError extends Error {
  }
  let loading = false;
  let archive = void 0;
  let lastUrl;
  let cleanupInterval;
  const cleanup = () => {
    clearInterval(cleanupInterval);
    cleanupInterval = setInterval(() => {
      if (!loading && archive) {
        Report.log(
          `serviceWorker`,
          `cleaning up unused epub archive reference (after 5mn)`
        );
        archive = void 0;
        lastUrl = void 0;
      }
    }, 5 * 60 * 1e3);
  };
  const loadBook = Report.measurePerformance(
    `serviceWorker`,
    Infinity,
    async (bookId) => {
      cleanup();
      if (bookId !== lastUrl) {
        archive = void 0;
        loading = false;
      }
      if (archive) {
        loading = false;
        return archive;
      }
      if (loading) {
        return new Promise((resolve, reject) => {
          setTimeout(async () => {
            try {
              resolve(await loadBook(bookId));
            } catch (e) {
              reject(e);
            }
          }, 100);
        });
      }
      loading = true;
      archive = void 0;
      const file = await getBookFile(bookId);
      if (!file) {
        loading = false;
        throw new FileNotFoundError(`FileNotFoundError`);
      }
      const newArchive = await getArchiveForFile(file);
      if (!newArchive) {
        loading = false;
        throw new FileNotSupportedError(`FileNotSupportedError`);
      }
      archive = newArchive;
      lastUrl = bookId;
      loading = false;
      return archive;
    }
  );
  const readerFetchListener = (event) => {
    const url = new URL(event.request.url);
    const shouldIntercept = url.pathname.startsWith(`/${STREAMER_URL_PREFIX}`);
    if (shouldIntercept) {
      const { epubFileName } = extractInfoFromEvent(event);
      event.respondWith(
        (async () => {
          try {
            const archive2 = await loadBook(epubFileName);
            if (url.pathname.endsWith(`/manifest`)) {
              return await dist.getManifestFromArchive(archive2, {
                baseUrl: `${url.origin}/${STREAMER_URL_PREFIX}/${epubFileName}`
              });
            }
            const resourcePath = getResourcePath(event);
            const response = await dist.getResourceFromArchive(archive2, resourcePath);
            return response;
          } catch (e) {
            if (e instanceof FileNotSupportedError) {
              return new Response(e.message, { status: 415 });
            }
            if (e instanceof FileNotFoundError) {
              return new Response(e.message, { status: 404 });
            }
            console.error(e);
            return new Response(e == null ? void 0 : e.message, { status: 500 });
          }
        })()
      );
    }
  };
  const extractEpubName = (url) => {
    const { pathname } = new URL(url);
    const urlWithoutPrefix = pathname.substring(`/${STREAMER_URL_PREFIX}/`.length);
    const nextSlashIndex = urlWithoutPrefix.indexOf("/");
    if (nextSlashIndex !== -1) {
      return urlWithoutPrefix.substring(0, urlWithoutPrefix.indexOf("/"));
    }
    return urlWithoutPrefix;
  };
  const extractInfoFromEvent = (event) => {
    const uri = new URL(event.request.url);
    const epubFileName = extractEpubName(event.request.url);
    const epubUrl = decodeURI(
      `${uri.origin}/${STREAMER_URL_PREFIX}/${epubFileName}`
    );
    return {
      epubUrl,
      epubFileName
    };
  };
  const getResourcePath = (event) => {
    const url = new URL(event.request.url);
    const { epubFileName } = extractInfoFromEvent(event);
    return decodeURIComponent(
      url.pathname.replace(`/${STREAMER_URL_PREFIX}/${epubFileName}/`, ``)
    );
  };
  clientsClaim();
  {
    precacheAndRoute([
      ...self.__WB_MANIFEST,
      {
        url: "/dropin.js"
      },
      {
        url: "/libunrar.js"
      },
      {
        url: "/libunrar.js.mem"
      }
    ]);
  }
  const fileExtensionRegexp = new RegExp("/[^/?]+\\.[^/]+$");
  {
    registerRoute(
      ({ request, url }) => {
        if (request.mode !== "navigate") {
          return false;
        }
        if (url.pathname.startsWith("/_")) {
          return false;
        }
        if (url.pathname.match(fileExtensionRegexp)) {
          return false;
        }
        return true;
      },
      createHandlerBoundToURL(process.env.PUBLIC_URL + "/index.html")
    );
  }
  {
    registerRoute(
      ({ url }) => url.origin === self.location.origin && !url.pathname.startsWith(`/${STREAMER_URL_PREFIX}`) && url.pathname.endsWith(".png"),
      new StaleWhileRevalidate({
        cacheName: "images",
        plugins: [
          new ExpirationPlugin({ maxEntries: 50 })
        ]
      })
    );
  }
  self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
      self.skipWaiting();
    }
  });
  self.addEventListener(`fetch`, readerFetchListener);
})();
//# sourceMappingURL=service-worker.js.map
