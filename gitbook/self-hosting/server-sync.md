# Server Sync

Server sync lets you expose and sync your content from the server directly (eg: same server, NAS on the network). This is the equivalent of what is usually done in other services (komga, kavita, stump, booklibre, etc).

## Mental model differences

oboku is quite different from your usual services and that makes it unique, powerful and flexible. Each users build their own libraries themselves. There is no unique library scanner running on the "server". Instead, users configure what they want, where and how. The Server Sync feature is literally just giving an additional data source option to your users.

## Configuration

Visit the `Server Sync` section in the admin to configure and enable it.

## Under the hood

When this feature is enabled, oboku essentially starts a webdav server that uses your configured sources so most of the underlying functionalities works the same as [webdav.md](../sync-providers/webdav.md "mention") sync provider.&#x20;
