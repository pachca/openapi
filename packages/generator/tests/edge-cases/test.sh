#!/bin/bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
OUT=$(mktemp -d)
trap 'rm -rf "$OUT"' EXIT

bun "$(dirname "$DIR")"/../bin/generator.ts \
  --spec "$DIR/fixture.yaml" \
  --output "$OUT" \
  --lang typescript,python,go,kotlin,swift

diff -r "$OUT" "$DIR/snapshots/"
