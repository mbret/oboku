# KOReader Sync

oboku can be the sync server of KOReader and of the other apps that speak its sync protocol, such as Readest and Crosspoint. Point every device at oboku and the reading position follows you from one to the next.

This only syncs reading positions, as the KOReader sync server does. It does not sync files, highlights or the library.

## Turn it on

In oboku, open **Profile > KOReader sync** and generate a password. The screen then shows the three values a device needs:

* **Server**: your oboku API address followed by `/kosync`. Copy it from the screen rather than typing it from memory.
* **Username**: the email of your oboku account.
* **Password**: the generated password. It is shown only once: oboku keeps nothing but a hash of it. Lost it? Generate a new one.

{% hint style="info" %}
The password is not your oboku password and gives access to nothing but your synced reading positions. Generating a new one signs out every device that used the previous one.
{% endhint %}

## Set up a device

In KOReader:

1. Open **Tools > Progress sync > Custom sync server** and enter the server.
2. Still in **Progress sync**, choose **Register / Login**, then **Login** with the username and password. There is no need to register: registering on oboku's server is disabled.

Readest, Crosspoint and the other compatible apps ask for the same three values in their KOReader sync settings.

Devices recognize a book only when they identify it the same way. KOReader identifies a book by the content of its file by default (the "binary" document matching method): keep the same method on every device, and the same copy of the file.

## Turn it off

**Profile > KOReader sync > Turn off KOReader sync** signs every device out and deletes the reading positions they synced. Deleting your account does the same.
