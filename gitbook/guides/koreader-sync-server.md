# KOReader Sync Server

oboku can be the sync server of KOReader and of the other apps that speak its sync protocol, such as Readest and Crosspoint. Point every device at oboku and they sync their reading position with each other through it.

{% hint style="info" %}
This does not sync your reading in oboku itself: oboku's reader neither sends its position to the server nor follows the positions your devices send.
{% endhint %}

This only syncs reading positions, as the KOReader sync server does. It does not sync files, highlights or the library.

## Turn it on

In oboku, open **Profile**, then **KOReader sync server** under **Other apps**, and generate a password. The screen then shows the three values a device needs:

* **Server**: your oboku API address followed by `/kosync`. Copy it from the screen rather than typing it from memory.
* **Username**: the email of your oboku account.
* **Password**: the generated password. It is shown only once: oboku keeps nothing but a hash of it. Lost it? Generate a new one.

{% hint style="info" %}
The password is not your oboku password and gives access to nothing but your synced reading positions. Generating a new one signs out every device that used the previous one.
{% endhint %}

## Set up a device

In KOReader:

1. Open **Tools > Progress sync > Custom sync server** and enter the server.
2. In the same **Progress sync** menu, tap **Register / Login**. In the form that opens, enter the username and password, then tap **Login**. Do not tap **Register**: the account already exists, it was created when you generated the password.

Readest, Crosspoint and the other compatible apps ask for the same three values in their KOReader sync settings.

Devices recognize a book only when they identify it the same way. KOReader identifies a book by the content of its file by default (the "binary" document matching method): keep the same method on every device, and the same copy of the file.

## Turn it off

**Profile > KOReader sync server > Turn off the KOReader sync server** signs every device out and deletes the reading positions they synced. Deleting your account does the same.
