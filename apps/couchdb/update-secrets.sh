#!/bin/bash
set -e


# Debug: Print environment variables to check if they're available
echo "DEBUG: JWT_PRIVATE_KEY_FILE = ${JWT_PRIVATE_KEY_FILE}"
echo "DEBUG: JWT_PUBLIC_KEY_FILE = ${JWT_PUBLIC_KEY_FILE}"

# Define paths
CONFIG_FILE="/opt/couchdb/etc/local.d/docker.ini"
PUBLIC_KEY_FILE="${JWT_PUBLIC_KEY_FILE}"

# Check if environment variables are set
if [ -z "$PUBLIC_KEY_FILE" ]; then
  echo "ERROR: JWT key file environment variables not set. Please define JWT_PRIVATE_KEY_FILE and JWT_PUBLIC_KEY_FILE."
  exit 1
fi

# Check if the key files exist
if [ ! -f "$PUBLIC_KEY_FILE" ]; then
  echo "ERROR: JWT key files not found. Please check the paths in environment variables."
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