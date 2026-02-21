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
#    - OR JWT_PUBLIC_KEY_FILE (path to file)
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

# Define paths
CONFIG_FILE="/opt/couchdb/etc/local.d/docker.ini"

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

# Create config file if it doesn't exist
if [ ! -f "$CONFIG_FILE" ]; then
  echo "Creating new CouchDB secrets config file..."
  touch "$CONFIG_FILE"
  
  # Set appropriate permissions
  chown couchdb:couchdb "$CONFIG_FILE"
  chmod 600 "$CONFIG_FILE"
fi

# Read the public key and convert newlines to \n
PUBLIC_KEY=$(cat "$PUBLIC_KEY_FILE" | sed ':a;N;$!ba;s/\n/\\n/g')

# Add JWT keys section if it doesn't exist
if ! grep -q "\[jwt_keys\]" "$CONFIG_FILE"; then
  echo "" >> "$CONFIG_FILE"
  echo "[jwt_keys]" >> "$CONFIG_FILE"
  echo "# Configure JWT keys for authentication" >> "$CONFIG_FILE"
  echo "# Using _default as the key identifier" >> "$CONFIG_FILE"
  
  # Determine key type (assuming RSA, but you can extend for EC if needed)
  if grep -q "BEGIN RSA PUBLIC KEY" "$PUBLIC_KEY_FILE" || grep -q "BEGIN PUBLIC KEY" "$PUBLIC_KEY_FILE"; then
    echo "rsa:_default = $PUBLIC_KEY" >> "$CONFIG_FILE"
    echo "Added RSA public key to CouchDB JWT configuration."
  else
    echo "# Unknown key type detected. Please verify the key format." >> "$CONFIG_FILE"
    echo "WARNING: Could not determine key type. Please check the configuration."
  fi
else
  echo "JWT keys section already exists in config file. Skipping."
fi

# Make sure permissions are correct
echo "JWT secrets initialization complete."