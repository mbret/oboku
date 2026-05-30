# Privacy & Parental (Secure) control

Oboku offers several way to lock and hide contents from your account. This can be useful when sharing the same account with kids for example as it can help prevent accidental destructive actions or hide some contents not targeted towards a certain age group.

## App Password

The app password is a local (encrypted) password which lets you lock & hide some of your contents. It will also be required to perform certains "dangerous" actions to prevent accidents.

The password is stored on the account level and will therefore be available to all devices once initialized. It is stored as encrypted and cannot be restored (but can be reset).

## Protected contents

By marking content as protected or assigning a protected tag to certain contents, they will be hidden by default and will require the app password to be unlocked.

### Policy for tags

* Tags marked as protected will be visible to anyone through the app. The tag itself is never hidden
* Books using a protected tag will be automatically hidden

### Policy for books

* A book using a protected tag will be hidden by default
* A protected book will never fetch metadata by default. This is to ensure no information is leaked to outside APIs. There is an option to allow this.

### Policy for collections

* A collection containing at least one protected book will be hidden by default
* A collection that is a series and contains at least one protected book will not fetch metadata by default. This is to ensure no information is leaked to outside APIs. There is an option to allow this.
