#!/usr/bin/env bash
# Run trigger evals for Pachca skills using skill-creator scripts.
#
# Key: runs claude -p from a CLEAN temp directory (no CLAUDE.md, no project
# files) so the only context Claude sees is the skill's command file — exactly
# like real users who install skills from the network.
#
# Usage:
#   ./scripts/run-trigger-evals.sh                    # all skills
#   ./scripts/run-trigger-evals.sh pachca-messages     # single skill
#   ./scripts/run-trigger-evals.sh --model haiku       # all skills, specific model

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SKILL_CREATOR="/tmp/anthropic-skills/skills/skill-creator"
RESULTS_DIR="$PROJECT_ROOT/evals/results"

# Create a clean sandbox so claude -p doesn't see our CLAUDE.md or other project files
SANDBOX=$(mktemp -d)
mkdir -p "$SANDBOX/.claude"
trap "rm -rf '$SANDBOX'" EXIT

# Parse args
SKILL_FILTER=""
MODEL_FLAG=""
RUNS_PER_QUERY=3

while [[ $# -gt 0 ]]; do
  case $1 in
    --model) MODEL_FLAG="--model $2"; shift 2 ;;
    --runs) RUNS_PER_QUERY="$2"; shift 2 ;;
    *) SKILL_FILTER="$1"; shift ;;
  esac
done

mkdir -p "$RESULTS_DIR"

SKILLS=(
  pachca-messages
  pachca-search
  pachca-chats
  pachca-users
  pachca-profile
  pachca-tasks
  pachca-bots
  pachca-forms
  pachca-security
)

# Filter to single skill if specified
if [[ -n "$SKILL_FILTER" ]]; then
  SKILLS=("$SKILL_FILTER")
fi

TOTAL_PASSED=0
TOTAL_FAILED=0
TOTAL_TESTS=0

echo "═══════════════════════════════════════════════════"
echo "  Pachca Skills — Trigger Evals"
echo "  $(date '+%Y-%m-%d %H:%M')"
echo "  Sandbox: $SANDBOX"
echo "═══════════════════════════════════════════════════"
echo ""

for skill in "${SKILLS[@]}"; do
  EVAL_SET="$PROJECT_ROOT/evals/trigger/${skill}.json"
  SKILL_PATH="$PROJECT_ROOT/skills/$skill"

  if [[ ! -f "$EVAL_SET" ]]; then
    echo "⏭  $skill — no eval set, skipping"
    continue
  fi

  echo "▶  $skill"

  RESULT_FILE="$RESULTS_DIR/${skill}-$(date '+%Y%m%d-%H%M%S').json"

  # Run from the clean sandbox directory. PYTHONPATH lets Python find the
  # skill-creator modules without cd-ing into that directory.
  # Separate stderr (verbose logs) from stdout (JSON results).
  LOG_FILE="${RESULT_FILE%.json}.log"
  cd "$SANDBOX"
  PYTHONPATH="$SKILL_CREATOR" python3 -m scripts.run_eval \
    --eval-set "$EVAL_SET" \
    --skill-path "$SKILL_PATH" \
    --runs-per-query "$RUNS_PER_QUERY" \
    --num-workers 5 \
    --timeout 30 \
    --verbose \
    $MODEL_FLAG \
    > "$RESULT_FILE" 2>"$LOG_FILE" || true
  cd "$PROJECT_ROOT"

  # Parse results
  if python3 -c "
import json, sys
try:
    data = json.load(open('$RESULT_FILE'))
    s = data['summary']
    print(f\"   ✓ {s['passed']}/{s['total']} passed, {s['failed']} failed\")
    for r in data['results']:
        status = 'PASS' if r['pass'] else 'FAIL'
        rate = f\"{r['triggers']}/{r['runs']}\"
        exp = '→trigger' if r['should_trigger'] else '→skip'
        print(f\"     [{status}] rate={rate} {exp}: {r['query'][:60]}\")
    sys.exit(0)
except Exception as e:
    print(f'   Error parsing results: {e}')
    sys.exit(1)
" 2>/dev/null; then
    PASSED=$(python3 -c "import json; print(json.load(open('$RESULT_FILE'))['summary']['passed'])")
    FAILED=$(python3 -c "import json; print(json.load(open('$RESULT_FILE'))['summary']['failed'])")
    TOTAL=$(python3 -c "import json; print(json.load(open('$RESULT_FILE'))['summary']['total'])")
    TOTAL_PASSED=$((TOTAL_PASSED + PASSED))
    TOTAL_FAILED=$((TOTAL_FAILED + FAILED))
    TOTAL_TESTS=$((TOTAL_TESTS + TOTAL))
  fi

  echo ""
done

echo "═══════════════════════════════════════════════════"
echo "  TOTAL: $TOTAL_PASSED/$TOTAL_TESTS passed, $TOTAL_FAILED failed"
echo "  Results saved to: $RESULTS_DIR/"
echo "═══════════════════════════════════════════════════"
