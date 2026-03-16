#!/usr/bin/env bash
# Run routing evals for Pachca skills.
#
# Tests whether Claude routes queries to the CORRECT skill when ALL skills
# are registered simultaneously. Unlike trigger evals (one skill at a time),
# this tests the full routing decision.
#
# Runs from a clean temp directory (no CLAUDE.md) so the only context Claude
# sees is the skill command files — like real users with installed skills.
#
# Usage:
#   ./scripts/run-routing-evals.sh                    # all cases
#   ./scripts/run-routing-evals.sh --model haiku      # specific model
#   ./scripts/run-routing-evals.sh --runs 5            # 5 runs per query

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RESULTS_DIR="$PROJECT_ROOT/evals/results"
EVAL_SET="$PROJECT_ROOT/evals/routing/pachca-routing.json"

# Create a clean sandbox
SANDBOX=$(mktemp -d)
mkdir -p "$SANDBOX/.claude"
trap "rm -rf '$SANDBOX'" EXIT

# Parse args
MODEL_FLAG=""
RUNS_PER_QUERY=1
NUM_WORKERS=5

while [[ $# -gt 0 ]]; do
  case $1 in
    --model) MODEL_FLAG="--model $2"; shift 2 ;;
    --runs) RUNS_PER_QUERY="$2"; shift 2 ;;
    --workers) NUM_WORKERS="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

mkdir -p "$RESULTS_DIR"

RESULT_FILE="$RESULTS_DIR/routing-$(date '+%Y%m%d-%H%M%S').json"
LOG_FILE="${RESULT_FILE%.json}.log"

echo "═══════════════════════════════════════════════════"
echo "  Pachca Skills — Routing Evals"
echo "  $(date '+%Y-%m-%d %H:%M')"
echo "  Sandbox: $SANDBOX"
echo "  Workers: $NUM_WORKERS, Runs/query: $RUNS_PER_QUERY"
echo "═══════════════════════════════════════════════════"
echo ""

cd "$SANDBOX"
python3 "$PROJECT_ROOT/scripts/run_routing_eval.py" \
  --eval-set "$EVAL_SET" \
  --skills-dir "$PROJECT_ROOT/skills" \
  --runs-per-query "$RUNS_PER_QUERY" \
  --num-workers "$NUM_WORKERS" \
  --timeout 30 \
  --verbose \
  $MODEL_FLAG \
  > "$RESULT_FILE" 2>"$LOG_FILE" || true
cd "$PROJECT_ROOT"

# Parse and display results
python3 -c "
import json, sys
try:
    data = json.load(open('$RESULT_FILE'))
    s = data['summary']
    print(f'Results: {s[\"correct\"]}/{s[\"total\"]} correct ({s[\"accuracy\"]:.1%})')
    print(f'  Wrong skill: {s[\"wrong_skill\"]}')
    print(f'  No skill: {s[\"no_skill\"]}')
    print()

    # Show failures
    failures = [r for r in data['results'] if not r['correct']]
    if failures:
        print('Failures:')
        for r in failures:
            got = r.get('most_common_skill', 'none')
            print(f'  expected={r[\"expected_skill\"]} got={got}: {r[\"query\"][:70]}')
    else:
        print('All routing decisions correct!')
except Exception as e:
    print(f'Error parsing results: {e}')
    print(f'Check log: $LOG_FILE')
" 2>/dev/null

echo ""
echo "Results: $RESULT_FILE"
echo "Log:     $LOG_FILE"
