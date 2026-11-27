---
title: "Android App"
---

The Android app is a [Trusted Web Activity](https://developer.chrome.com/docs/android/trusted-web-activity) (TWA) that [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) generates from `apps/android/twa-manifest.json`. That file is the only Android source in the repository. The Android project is build output: Bubblewrap generates it into `apps/android/dist`, which git ignores.

## How it works

The package holds a launcher, the icons and the address `https://app.oboku.me/`. It holds no web code. The app opens that address full screen in the browser installed on the phone, so the service worker, the offline storage and every web release are the same as in the browser. A web release needs no Android release.

The browser hides its address bar only when `https://app.oboku.me/.well-known/assetlinks.json` names the package `me.oboku.app.twa` and the SHA-256 fingerprint of the key that signed it. If they do not match, the app opens in a Custom Tab with the address bar. An address bar in the app means a wrong or missing fingerprint.

The host is fixed at build time, so the app opens `app.oboku.me` only. A self-hosted instance stays a web app that the user installs from the browser.

## Workflow

`.github/workflows/android.yml` has two jobs:

- **`build`** generates the project with `bubblewrap update`, then builds it unsigned with `bubblewrap build --skipSigning`. It has no access to the signing key.
- **`sign`** runs on a fresh runner. It signs the APK with `apksigner` from the Android SDK, and the bundle with `jarsigner` from the JDK. Only GitHub's own actions run in this job, and only the signing step gets the key and its password, so Bubblewrap's dependencies never see them.

The workflow runs in two cases:

- **A pull request that changes `apps/android/**` or the workflow.** Only `build` runs, so a broken config fails before the merge.
- **A manual run.** In GitHub, open **Actions**, select **Android**, then **Run workflow** on `master`. Both jobs run, and `sign` uploads the `android-release` artifact. The artifact holds `app-release-bundle.aab`, the file to upload to Google Play, and `app-release-signed.apk`, the file to install on a phone by hand.

The `sign` job runs in the `android-release` environment. Create it in the repository settings, under **Environments**. Limit its deployment branches to `master`, so no other branch can read the signing key. Then add two secrets to that environment:

| Secret                      | Value                                  |
| --------------------------- | -------------------------------------- |
| `ANDROID_KEYSTORE_BASE64`   | The upload keystore, encoded in base64 |
| `ANDROID_KEYSTORE_PASSWORD` | The keystore password                  |

## Create the upload key

With Play App Signing, Google signs the store build with its own keys. The key in the workflow is the upload key: Google Play accepts a bundle only when this key signed it.

1. Create the keystore with `keytool`, in a private folder outside the repository. It asks for a password of at least 6 characters, then for the certificate fields:

   ```bash
   keytool -genkeypair -keystore android.keystore -alias android -keyalg RSA -validity 20000
   ```

2. Encode the keystore and copy the output into `ANDROID_KEYSTORE_BASE64`. On macOS, use `base64 -i android.keystore`:

   ```bash
   base64 -w0 android.keystore
   ```

3. Keep a backup of the keystore and its password outside GitHub.

The workflow uses the keystore password as the key password too. A PKCS12 keystore, the `keytool` default, has no key password of its own.

## Fingerprints

`sha256_cert_fingerprints` in `apps/web/public/.well-known/assetlinks.json` lists the fingerprints. Each key that signs the app on a phone needs one:

- **The app signing keys**, for the app installed from Google Play. The app uses quantum-ready hybrid signing, which has three app signing keys, and the file lists all three. In the Play Console, open **Protected with Play**, expand **Play Store protection** and select **Manage Play app signing**. Then copy the SHA-256 fingerprints with **Copy all certificate fingerprints**. The **Digital Asset Links JSON** on that page shows only one of them.
- **The upload key**, for the APK from the workflow installed by hand. Print its fingerprint with `keytool -list -v -keystore android.keystore -alias android`.

A fingerprint change reaches phones with the next web release. It needs no Android release, because the package does not hold the fingerprints.

## Release a new version

Google Play refuses a bundle whose version code is not higher than the last upload.

1. In `twa-manifest.json`, increase `appVersionCode` by one. Set `appVersion`, the version name shown to users, to the same number.
2. Merge the change and release it.
3. Run the workflow on `master`, then upload `app-release-bundle.aab` from the artifact to a track in the Play Console.

The package keeps the name, the colours and the icons it had at build time. Bubblewrap reads them from `twa-manifest.json` and downloads the images its icon addresses point to. A change to them, or to the Bubblewrap version, reaches phones only with a new Android version. A change to the web manifest does not reach the app: copy it into `twa-manifest.json`.

## Raise the target API level

Google Play raises the [target API level](https://support.google.com/googleplay/android-developer/answer/11926878) it requires every year, at the end of August. Bubblewrap sets `targetSdkVersion` in the generated project: Bubblewrap 1.27.0 sets API level 36.

1. Change the Bubblewrap version to a release that targets the new level: `BUBBLEWRAP_CLI` in the workflow, and the commands in [Build on your computer](#build-on-your-computer).
2. Check `targetSdkVersion` in the generated `apps/android/dist/app/build.gradle`.
3. Release a new version.

## Build on your computer

Bubblewrap needs JDK 17 and the Android SDK. It reads their paths from `~/.bubblewrap/config.json`, and asks for them, or offers to download them, when the file is missing. Bubblewrap 1.27.0 rejects an SDK that has no `bin` or `tools` folder at its root, which is the layout Android Studio installs. Link the folder as the workflow does:

```bash
ln -s "$ANDROID_HOME/cmdline-tools/latest/bin" "$ANDROID_HOME/bin"
```

From `apps/android`:

```bash
pnpm dlx @bubblewrap/cli@1.27.0 update --skipVersionUpgrade --manifest=twa-manifest.json --directory=dist
```

Then from `apps/android/dist`:

```bash
pnpm dlx @bubblewrap/cli@1.27.0 build --skipSigning --manifest=../twa-manifest.json
```

Signed builds come from the workflow only, so Bubblewrap's dependencies never run next to the upload key.
