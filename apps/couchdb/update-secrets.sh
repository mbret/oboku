#!/bin/bash

# ==============================================================================
# CouchDB JWT Configuration Script
# ==============================================================================
#
# WHAT:
# This script configures CouchDB to support JWT (JSON Web Token) authentication.
# It injects the RSA public key into the CouchDB configuration file.
#
# WHY:
# To enable CouchDB to validate JWT tokens signed by the backend application.
# This allows for stateless authentication where CouchDB trusts tokens issued
# by the API service, granting access based on token claims.
#
# HOW:
# 1. Checks for public key in environment variables:
#    - JWT_PUBLIC_KEY (base64 encoded content)
#    - OR JWT_PUBLIC_KEY_FILE (path to file), generating the pair on first
#      start when that path does not exist yet
# 2. Ensures the CouchDB local configuration file exists.
# 3. Reads the public key and escapes newlines for INI compatibility.
# 4. Appends the [jwt_keys] section with the formatted public key to
#    /opt/couchdb/etc/local.d/docker.ini if not already present.
#
# ==============================================================================

set -e


# Debug: Print environment variables to check if they're available
echo "DEBUG: JWT_PRIVATE_KEY_FILE = ${JWT_PRIVATE_KEY_FILE}"
echo "DEBUG: JWT_PUBLIC_KEY_FILE = ${JWT_PUBLIC_KEY_FILE}"
if [ -n "$JWT_PUBLIC_KEY" ]; then echo "DEBUG: JWT_PUBLIC_KEY is set"; else echo "DEBUG: JWT_PUBLIC_KEY is not set"; fi
if [ -n "$JWT_PRIVATE_KEY" ]; then echo "DEBUG: JWT_PRIVATE_KEY is set"; else echo "DEBUG: JWT_PRIVATE_KEY is not set"; fi

# Define paths. The JWT configuration lives in a file this script fully owns:
# docker.ini is shared with CouchDB's own entrypoint, which appends the admin
# credentials to it.
CONFIG_FILE="/opt/couchdb/etc/local.d/oboku-jwt.ini"
COUCHDB_CONFIG_FILE="/opt/couchdb/etc/local.d/docker.ini"

# Determine source of the public key
if [ -n "$JWT_PUBLIC_KEY" ]; then
  echo "Using JWT_PUBLIC_KEY from environment variable (base64)..."
  # Create a temporary file to store the decoded key
  PUBLIC_KEY_FILE="/tmp/jwt_public_key.pem"
  # Decode base64 to file
  echo "$JWT_PUBLIC_KEY" | base64 -d > "$PUBLIC_KEY_FILE"
elif [ -n "$JWT_PUBLIC_KEY_FILE" ]; then
  echo "Using JWT_PUBLIC_KEY_FILE from path: $JWT_PUBLIC_KEY_FILE"
  PUBLIC_KEY_FILE="$JWT_PUBLIC_KEY_FILE"

  # CouchDB boots before the API, so this is the first thing in the stack to
  # need the pair and the only place that can create it in time. Keys are only
  # ever created when absent, so restarts keep signing with the same ones.
  if [ ! -f "$PUBLIC_KEY_FILE" ]; then
    if [ -z "$JWT_PRIVATE_KEY_FILE" ]; then
      echo "ERROR: $PUBLIC_KEY_FILE does not exist and JWT_PRIVATE_KEY_FILE is not set,"
      echo "so there is nowhere to write a generated key pair."
      exit 1
    fi

    mkdir -p "$(dirname "$JWT_PRIVATE_KEY_FILE")" "$(dirname "$PUBLIC_KEY_FILE")"

    if [ ! -f "$JWT_PRIVATE_KEY_FILE" ]; then
      echo "No JWT private key yet, generating one at $JWT_PRIVATE_KEY_FILE..."
      openssl genrsa -out "$JWT_PRIVATE_KEY_FILE" 4096
      chmod 600 "$JWT_PRIVATE_KEY_FILE"
    fi

    echo "Deriving the JWT public key at $PUBLIC_KEY_FILE..."
    openssl rsa -in "$JWT_PRIVATE_KEY_FILE" -pubout -outform PEM -out "$PUBLIC_KEY_FILE"
    chmod 644 "$PUBLIC_KEY_FILE"
  fi
else
  echo "ERROR: Neither JWT_PUBLIC_KEY (base64) nor JWT_PUBLIC_KEY_FILE (path) environment variables are set."
  echo "Please define one of them to configure CouchDB JWT authentication."
  exit 1
fi

# Check if the key files exist (validates both file path provided or temp file creation)
if [ ! -f "$PUBLIC_KEY_FILE" ]; then
  echo "ERROR: JWT public key file not found at $PUBLIC_KEY_FILE."
  exit 1
fi

# Read the public key and convert newlines to \n
PUBLIC_KEY=$(sed ':a;N;$!ba;s/\n/\\n/g' "$PUBLIC_KEY_FILE")

if ! grep -q "BEGIN RSA PUBLIC KEY" "$PUBLIC_KEY_FILE" && ! grep -q "BEGIN PUBLIC KEY" "$PUBLIC_KEY_FILE"; then
  echo "ERROR: $PUBLIC_KEY_FILE is not an RSA public key. CouchDB would start with"
  echo "no usable JWT key and reject every authenticated request."
  exit 1
fi

# Rewritten on every start rather than written once: a regenerated or rotated
# key has to replace the one CouchDB validates against, or CouchDB keeps
# trusting the public key from the first boot while the API signs with the new
# private one.
printf '[jwt_keys]\nrsa:_default = %s\n' "$PUBLIC_KEY" > "$CONFIG_FILE"
chown couchdb:couchdb "$CONFIG_FILE"
chmod 600 "$CONFIG_FILE"
echo "Wrote the RSA public key to $CONFIG_FILE."

# Earlier versions appended the section to docker.ini, where it would now shadow
# the key above. Drop just that section and leave the credentials CouchDB's
# entrypoint keeps in the same file untouched.
if [ -f "$COUCHDB_CONFIG_FILE" ] && grep -q '^\[jwt_keys\]' "$COUCHDB_CONFIG_FILE"; then
  echo "Removing the superseded [jwt_keys] section from $COUCHDB_CONFIG_FILE..."
  awk '/^\[jwt_keys\]/ { inSection = 1; next } /^\[/ { inSection = 0 } !inSection' \
    "$COUCHDB_CONFIG_FILE" > "$COUCHDB_CONFIG_FILE.tmp"
  cat "$COUCHDB_CONFIG_FILE.tmp" > "$COUCHDB_CONFIG_FILE"
  rm -f "$COUCHDB_CONFIG_FILE.tmp"
fi

# Make sure permissions are correct
echo "JWT secrets initialization complete."