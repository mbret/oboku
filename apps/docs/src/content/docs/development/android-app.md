---
title: "Android App"
---

The Android app is a [Trusted Web Activity](https://developer.chrome.com/docs/android/trusted-web-activity) (TWA) that [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) generates from `apps/android/twa-manifest.json`. That file is the only Android source in the repository. The Android project is build output: Bubblewrap generates it into `apps/android/dist`, which git ignores.

## How it works

The package holds a launcher, the icons and the address `https://app.oboku.me/`. It holds no web code. The app opens that address full screen in the browser installed on the phone, so the service worker, the offline storage and every web release are the same as in the browser. A web release needs no Android release.

The browser hides its address bar only when `https://app.oboku.me/.well-known/assetlinks.json` names the package `me.oboku.app.twa` and the SHA-256 fingerprint of the key that signed it. If they do not match, the app opens in a Custom Tab with the address bar. An address bar in the app means a wrong or missing fingerprint.

The host is fixed at build time, so the app opens `app.oboku.me` only. A self-hosted instance stays a web app that the user installs from the browser.

## Workflow

`.github/workflows/android.yml` generates the project with `bubblewrap update`, then builds it with `bubblewrap build`. It runs in two cases:

* **A pull request that changes `apps/android/**` or the workflow.** It builds without signing, so a broken config fails before the merge.
* **A manual run.** In GitHub, open **Actions**, select **Android**, then **Run workflow**. It builds, signs, and uploads the `android-release` artifact. The artifact holds `app-release-bundle.aab`, the file to upload to Google Play, and `app-release-signed.apk`, the file to install on a phone by hand.

The manual run needs three repository secrets:

| Secret                      | Value                                               |
| --------------------------- | --------------------------------------------------- |
| `ANDROID_KEYSTORE_BASE64`   | The upload keystore, encoded in base64              |
| `ANDROID_KEYSTORE_PASSWORD` | The keystore password                               |
| `ANDROID_KEY_PASSWORD`      | The key password, the same as the keystore password |

## Create the upload key

With Play App Signing, Google signs the store build with its own key. The key in the workflow is the upload key: Google Play accepts a bundle only when this key signed it.

1. Create the keystore with the JDK 17 `keytool`. It asks for a password and for the certificate fields:

   ```bash
   keytool -genkeypair -keystore android.keystore -alias android -keyalg RSA -validity 20000
   ```

2. Use letters and digits only in the password, and at least 6 characters. Bubblewrap 1.27.0 sends the password to `apksigner` and `jarsigner` through a shell, so `$`, `"`, `` ` `` and `\` break the signing step.
3. Use the keystore password for both password secrets. A PKCS12 keystore, the `keytool` default, has no key password of its own.
4. Encode the keystore and copy the output into `ANDROID_KEYSTORE_BASE64`. On macOS, use `base64 -i android.keystore`:

   ```bash
   base64 -w0 android.keystore
   ```

5. Keep a backup of the keystore and its password outside GitHub. Never commit the keystore.

## Fingerprints

Two files list the fingerprints, and they must agree:

* `sha256_cert_fingerprints` in `apps/web/public/.well-known/assetlinks.json`. The browser reads this file.
* `fingerprints` in `apps/android/twa-manifest.json`, as `{ "name": "…", "value": "…" }` entries.

Two keys need a fingerprint:

* **The app signing key**, for the app installed from Google Play. Copy its SHA-256 fingerprint from the Play Console, on the **App signing** page of **App integrity**.
* **The upload key**, for the APK from the workflow installed by hand. Print its fingerprint with `keytool -list -v -keystore android.keystore -alias android`.

To change a fingerprint, edit both files by hand in one pull request. The change reaches phones with the next web release. It needs no Android release.

## Release a new version

Google Play refuses a bundle whose version code is not higher than the last upload.

1. In `twa-manifest.json`, increase `appVersionCode` by one. Set `appVersion`, the version name shown to users, to the same number.
2. Merge the change and release it.
3. Run the workflow on `master`, then upload `app-release-bundle.aab` from the artifact to a track in the Play Console.

The package keeps the name, the colours and the icons it had at build time. Bubblewrap reads them from `twa-manifest.json` and downloads the images its icon addresses point to. A change to them, or to the Bubblewrap version, reaches phones only with a new Android version. A change to the web manifest does not reach the app: copy it into `twa-manifest.json`.

## Raise the target API level

Google Play raises the [target API level](https://support.google.com/googleplay/android-developer/answer/11926878) it requires every year, at the end of August. Bubblewrap sets `targetSdkVersion` in the generated project: Bubblewrap 1.27.0 sets API level 36.

1. Change `BUBBLEWRAP_CLI` in the workflow to a Bubblewrap release that targets the new level.
2. Check `targetSdkVersion` in the generated `apps/android/dist/app/build.gradle`.
3. Release a new version.

## Build on your computer

Bubblewrap needs JDK 17 and the Android SDK. It reads their paths from `~/.bubblewrap/config.json`, and asks for them, or offers to download them, when the file is missing. From `apps/android`:

```bash
pnpm dlx @bubblewrap/cli@1.27.0 update --skipVersionUpgrade --manifest=twa-manifest.json --directory=dist
```

Then from `apps/android/dist`, with `android.keystore` in that folder:

```bash
pnpm dlx @bubblewrap/cli@1.27.0 build --manifest=../twa-manifest.json
```

Add `--skipSigning` to build without a keystore.
