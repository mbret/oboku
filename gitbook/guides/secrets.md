# Secrets

Secrets are how you keep your confidential information safe.

Some configuration such as adding a datasource or configuring extra features will requires you to provide confidential information only you should know. Although oboku will need to use them at some points, they are encrypted in your own database and can be decrypted only by you.

This means that in the situation were oboku would be compromised, an attacker would have no way to read your secrets.

When oboku needs to read your secrets to perform actions (eg: synchronize a datasource) it will prompt you for your passport and use the decrypted secrets only for that process lifetime. They will be kept in memory and discarded as soon as the process is done.

## Master Password

To manage secrets you need to first setup a master password. This is a password set on your profile which will be used to encrypt / decrypt secrets. You can change your password whenever you want without affecting your secrets but in the situation were you lose it and want to reset it all your secrets will be lost.

{% hint style="warning" %}
If you lose your master password and want to reset it, keep in minds all your secrets will be unusable and have to be redo again.
{% endhint %}

