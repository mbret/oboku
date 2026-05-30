# Local Profile

The app keeps its local profile & settings in local storage. They contains:

* user authentication information
* app settings for the current user

Account settings are persisted to the remote database.

## Storage strategy

All settings are persisted as they changes. We use reactjrx signal persistence for persist/hydrate.

Hydratation is done on app startup and will block the app until its done (splash screen).

When the user is not logged, we store the profile in a temporary key. Once the user log in we change the key to the user name itself. The reason behind this is to be able to retrieve a specific user profile even when they switch account on the app.

There are no cleanup strategies for now. We might want to consider one as the storage will keep piling up if an app is used with many users. Although this seems to be an edge cases. Maybe we can have a setting in the app to let the current user remove the other profiles

## Security concerns

Because we do not want to leak information between users, all of the authentication info are removed when user log out or is logged out. Another user of the device could be able to only see app settings.

We can consider an encryption strategy for local profile. For now we don't keep anything sensitive.

