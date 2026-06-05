#!/usr/bin/env bash
# Local mirror of the SDK CI "Generate and build" job (.github/workflows/sdk.yml).
# Compiles all 6 SDKs from the current openapi.yaml so spec changes that break a
# language SDK are caught locally BEFORE push (CI skips these steps when the SDK
# is unchanged, so a green PR can still hide a latent break until the next spec
# change actually regenerates the SDKs).
#
# Usage: bash scripts/build-sdks.sh   (or: bun run sdk:build)
#
# A missing toolchain (go/python3/gradle/dotnet/swift) is reported as SKIP, not
# failure — install it to get full local coverage. A present toolchain that
# fails compilation makes this script exit non-zero.
set -uo pipefail
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
fail=0
have() { command -v "$1" >/dev/null 2>&1; }
step() { printf '\n=== %s ===\n' "$1"; }
run() { if "$@"; then echo "  OK"; else echo "  FAIL"; fail=1; fi; }

step "Generate SDKs from openapi.yaml"
run bunx turbo run generate

step "TypeScript: build + smoke + attw verify"
( cd sdk/typescript && bun run build && bun run test:node && bun run verify ) \
  && echo "  OK" || { echo "  FAIL"; fail=1; }

step "Go: go build ./..."
if have go; then ( cd sdk/go/generated && run go build ./... ); else echo "  SKIP (go not installed)"; fi

step "Python: py_compile"
if have python3; then
  ( cd sdk/python/generated && run sh -c 'python3 -m py_compile $(find pachca -name "*.py")' )
else echo "  SKIP (python3 not installed)"; fi

step "Kotlin: gradlew compileKotlin"
if [ -x sdk/kotlin/generated/gradlew ]; then
  ( cd sdk/kotlin/generated && run ./gradlew -q compileKotlin -Pversion=0.0.0 )
else echo "  SKIP (kotlin gradlew not available)"; fi

step "C#: dotnet build"
if have dotnet; then ( cd sdk/csharp/generated && run dotnet build -v q ); else echo "  SKIP (dotnet not installed)"; fi

step "Swift: swift build"
if have swift; then ( cd sdk/swift/generated && run swift build ); else echo "  SKIP (swift not installed)"; fi

echo
if [ "$fail" -ne 0 ]; then echo "SDK build: FAILED (see above)"; exit 1; fi
echo "SDK build: all available toolchains OK"
