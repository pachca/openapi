#!/usr/bin/env bash
# Run a set of requests against the tool listing through a real client.
#
# The tools are registered with a stdio MCP server, so the model receives them
# the way it will in production and answers with its own tool-call machinery.
# Each request runs in its own process from an empty directory, so nothing of
# this repository leaks into the context.
#
# Usage:
#   scripts/eval/run.sh <run-dir> <model> <pass-label> [ask-id ...]
#
# Reads  <run-dir>/in/{tools.json,instructions.txt,asks.json}
#        <run-dir>/responses.json — what the fake workspace answers, copied from
#        world.json by build-inputs. A stub that says only "done" dead-ends every
#        chain: the agent looks a person up by name, gets nothing back, and the
#        prose takes the blame for the instrument.
# Writes <run-dir>/out/<model>-<pass-label>.json — one record per request:
#        {"id", "calls": [{"name", "arguments"}, …], "text"}
#
# Every call is kept, not only the first. Which call does the work is a property
# of the shape of the set, not of the agent: where one shape acts at once,
# another has to resolve the name first and acts on the second call. Scoring the
# first call alone measures the shape instead of the work.
set -euo pipefail

RUN_DIR="${1:?run directory}"
MODEL="${2:?model}"
PASS="${3:?pass label}"
shift 3 || true
ONLY=("$@")

SPEC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STUB="$SPEC_DIR/scripts/eval/stub-server.ts"
IN="$RUN_DIR/in"
RESPONSES="$RUN_DIR/responses.json"
OUT="$RUN_DIR/out/$MODEL-$PASS.json"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "[" > "$OUT"
first=1
count=$(python3 -c "import json;print(len(json.load(open('$IN/asks.json'))))")

for i in $(seq 0 $((count - 1))); do
  id=$(python3 -c "import json;print(json.load(open('$IN/asks.json'))[$i]['id'])")
  if [ ${#ONLY[@]} -gt 0 ] && [[ ! " ${ONLY[*]} " =~ " $id " ]]; then continue; fi
  prompt=$(python3 -c "import json;print(json.load(open('$IN/asks.json'))[$i]['prompt'])")

  record="$WORK/$id.jsonl"
  : > "$record"
  config="$WORK/$id.mcp.json"
  python3 - "$config" "$STUB" "$IN/tools.json" "$record" "$IN/instructions.txt" "$RESPONSES" <<'PY'
import json, os, sys
config, stub, tools, record, instructions, responses = sys.argv[1:7]
env = {"EVAL_TOOLS": tools, "EVAL_RECORD": record, "EVAL_INSTRUCTIONS": instructions}
if os.path.exists(responses):
    env["EVAL_RESPONSES"] = responses
json.dump({"mcpServers": {"pachca": {"command": "bun", "args": [stub], "env": env}}}, open(config, "w"))
PY

  # User settings bring hooks that inject earlier sessions and plugins with skills
  # of their own; either puts text in front of the model that no client of the
  # server would. Only the empty directory's settings load, and no skills. The
  # built-in tools a client of the server does not offer are denied too — a
  # question dialogue invites asking instead of doing; tool search stays, since
  # a client with a long listing loads tools through it.
  cd "$WORK" && claude -p "$prompt" \
    --model "$MODEL" \
    --setting-sources project --disable-slash-commands \
    --mcp-config "$config" --strict-mcp-config \
    --allowed-tools "mcp__pachca" \
    --disallowed-tools "Bash Read Write Edit Glob Grep WebFetch WebSearch Task Agent AskUserQuestion TodoWrite Skill EnterPlanMode ExitPlanMode NotebookEdit EnterWorktree ExitWorktree CronCreate CronDelete CronList RemoteTrigger TaskOutput TaskStop" \
    --output-format text < /dev/null > "$WORK/$id.txt" 2>/dev/null || true

  python3 - "$OUT" "$id" "$record" "$first" "$WORK/$id.txt" <<'PY'
import json, sys, os
out, ask_id, record, first, answer = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4] == "1", sys.argv[5]
text = open(answer, encoding="utf-8").read().strip() if os.path.exists(answer) else ""
calls = [json.loads(line) for line in open(record, encoding="utf-8")] if os.path.exists(record) else []
row = {
    "id": ask_id,
    "calls": [
        {"name": c.get("name"), "arguments": c.get("arguments") or {}, **({"refused": c["refused"]} if c.get("refused") else {})}
        for c in calls
    ],
    "text": text[:4000],
}
with open(out, "a", encoding="utf-8") as f:
    f.write(("" if first else ",\n") + json.dumps(row, ensure_ascii=False))
PY
  first=0
  printf '.'
done

echo "]" >> "$OUT"
echo
echo "written: $OUT"
