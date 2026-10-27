#!/usr/bin/env sh
# Renders the built assets from ASSET_TEMPLATE_DIR into ASSET_DIR, replacing the
# __VAR__ placeholders they were built with by the values of the matching
# environment variables. Runs as an nginx entrypoint hook, before nginx serves
# anything, so one prebuilt image can be pointed at a different backend.
#
# Rendering from a pristine template on every start is what keeps that
# repeatable: substituting in place consumes the placeholders, so a later change
# to the variables would silently have no effect.
#
# The placeholders are delimited rather than bare variable names so a name that
# prefixes another (VITE_API_URL / VITE_API_URL_2) cannot rewrite the start of
# the longer placeholder. That delimited form is also what readInjectedEnv in
# @oboku/shared recognizes as "not injected".

set -e

: "${APP_PREFIX:?APP_PREFIX must be set (e.g. APP_PREFIX='VITE_')}"
: "${ASSET_TEMPLATE_DIR:?ASSET_TEMPLATE_DIR must be set to the directory holding the built assets}"
: "${ASSET_DIR:?ASSET_DIR must be set to the directory nginx serves}"

mkdir -p "$ASSET_DIR"
find "$ASSET_DIR" -mindepth 1 -delete
cp -a "$ASSET_TEMPLATE_DIR/." "$ASSET_DIR/"

sedScript=$(mktemp)
trap 'rm -f "$sedScript"' EXIT

env | grep "^${APP_PREFIX}" | while IFS='=' read -r key value; do
  echo "env.sh: substituting ${key}"
  escapedValue=$(printf '%s' "$value" | sed 's/[\\&|]/\\&/g')
  printf 's|__%s__|%s|g\n' "$key" "$escapedValue" >>"$sedScript"
done

if [ ! -s "$sedScript" ]; then
  echo "env.sh: no ${APP_PREFIX}* variables set, serving the built defaults."
  exit 0
fi

find "$ASSET_DIR" -type f \
  \( -name '*.js' -o -name '*.css' -o -name '*.html' -o -name '*.json' -o -name '*.webmanifest' \) \
  -exec sed -i -f "$sedScript" {} +
