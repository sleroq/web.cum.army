#!/usr/bin/env bash

set -euo pipefail

# Ensure we are in the project root
cd "$(dirname "$0")/.."

echo "Calculating new npmDepsHash..."
NEW_HASH=$(nix run nixpkgs#prefetch-npm-deps -- package-lock.json)

echo "New hash: $NEW_HASH"

if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s|npmDepsHash = \".*\";|npmDepsHash = \"$NEW_HASH\";|" package.nix
else
  sed -i "s|npmDepsHash = \".*\";|npmDepsHash = \"$NEW_HASH\";|" package.nix
fi

echo "Successfully updated package.nix"
