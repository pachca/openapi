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
# `run` inside a subshell — ( cd dir && run cmd ) — sets fail=1 in the SUBSHELL,
# so the parent never sees it and the script exits 0 after printing FAIL. Use
# run_in: the cd stays isolated, the exit status is evaluated in the parent.
run_in() { local dir="$1"; shift; if ( cd "$dir" && "$@" ); then echo "  OK"; else echo "  FAIL"; fail=1; fi; }

step "Generate SDKs from openapi.yaml"
run bunx turbo run generate

step "TypeScript: build + smoke + attw verify"
( cd sdk/typescript && bun run build && bun run test:node && bun run verify ) \
  && echo "  OK" || { echo "  FAIL"; fail=1; }

step "Go: go build ./..."
if have go; then run_in sdk/go/generated go build ./...; else echo "  SKIP (go not installed)"; fi

step "Python: py_compile + import"
if have python3; then
  run_in sdk/python/generated sh -c 'python3 -m py_compile $(find pachca -name "*.py")'
  # py_compile only parses: a module-level NameError (e.g. a registry naming a
  # type that was never imported) compiles fine and blows up on import. Import
  # the package for real, with httpx stubbed so the check needs no dependencies.
  run_in sdk/python/generated python3 -c '
import sys, types
stub = types.ModuleType("httpx")
stub.__getattr__ = lambda name: type(name, (), {})
sys.modules["httpx"] = stub
import pachca.models, pachca.utils
'
else echo "  SKIP (python3 not installed)"; fi

step "Kotlin: gradlew compileKotlin"
if [ -x sdk/kotlin/generated/gradlew ]; then
  run_in sdk/kotlin/generated ./gradlew -q compileKotlin -Pversion=0.0.0
else echo "  SKIP (kotlin gradlew not available)"; fi

step "C#: dotnet build"
if have dotnet; then run_in sdk/csharp/generated dotnet build -v q; else echo "  SKIP (dotnet not installed)"; fi

step "Swift: swift build"
if have swift; then run_in sdk/swift/generated swift build; else echo "  SKIP (swift not installed)"; fi

echo
if [ "$fail" -ne 0 ]; then echo "SDK build: FAILED (see above)"; exit 1; fi
echo "SDK build: all available toolchains OK"
