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
#        {"id", "ran_at", "calls": [{"name", "arguments"}, …], "text",
#         "searched", "loaded", "client_errors"}
#        where ran_at is when the request started, in milliseconds since the
#        epoch: relative dates in it are read against that day, and the time
#        survives merging and re-running parts of a pass.
#        and <run-dir>/out/raw/<model>-<pass-label>/<ask-id>.jsonl — what the
#        client streamed for that request, event by event.
#
# The client loads tools on demand, so a description is read only if its tool
# was loaded. `searched` is what the model asked the tool search for, `loaded`
# the tools it got back — which descriptions it could have read before a call —
# and `client_errors` the calls the client refused before they reached the
# server: a run that says «done» with no call recorded either made it up or was
# stopped there, and only the stream tells which.
#
# Every call is kept, not only the first. Which call does the work is a property
# of the shape of the set, not of the agent: where one shape acts at once,
# another has to resolve the name first and acts on the second call. Scoring the
# first call alone measures the shape instead of the work.
set -euo pipefail

# A run has to see what a person with a current client sees. From 2.1.84 on the
# client keeps only the first 2048 characters of the instructions and of every
# tool description; an older one reads them whole and measures text nobody gets.
MIN_CLAUDE="2.1.84"
HAVE_CLAUDE="$(claude --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || true)"
if [ -z "$HAVE_CLAUDE" ] || [ "$(printf '%s\n%s\n' "$MIN_CLAUDE" "$HAVE_CLAUDE" | sort -V | head -1)" != "$MIN_CLAUDE" ]; then
  echo "claude $MIN_CLAUDE or newer is needed, found ${HAVE_CLAUDE:-none}: an older client does not cut instructions and descriptions the way current ones do" >&2
  exit 1
fi

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
RAW="$RUN_DIR/out/raw/$MODEL-$PASS"
mkdir -p "$RAW"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# A client signed in to an account puts that account's email into the context,
# and the model then looks the operator up in the workspace instead of acting as
# the caller the instructions name. Neither a system prompt nor the environment
# removes it. With an API key the client runs bare: no account, hooks, CLAUDE.md
# or memory; the MCP config and the tool list still apply.
BARE=()
if [ -n "${ANTHROPIC_API_KEY:-}" ]; then
  BARE=(--bare)
else
  echo "ANTHROPIC_API_KEY is not set: the client signs in with the operator's account and puts its email into the context, which can pull self-addressed requests (write-dm-self, self-id, word-remind, bot-write-me) off the caller" >&2
fi

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

  # The request's start time goes into its record: the scorer reads relative
  # dates against the day the request ran, not the day its file was written.
  started=$(python3 -c 'import time;print(int(time.time()*1000))')

  # User settings bring hooks that inject earlier sessions and plugins with skills
  # of their own; either puts text in front of the model that no client of the
  # server would. Only the empty directory's settings load, and no skills.
  # Of the client's own tools only tool search is offered, through --tools: a
  # deny list falls behind every release. 2.1.292 added TaskCreate, TaskList,
  # TaskGet, TaskUpdate, SendMessage, Artifact, Monitor, Workflow and more, and a
  # request to set a task went to the client's own task list. Tool search stays,
  # since a client with a long listing loads tools through it. An allow list also
  # keeps the host's environment from adding tools of its own to a run.
  cd "$WORK" && claude -p "$prompt" \
    --model "$MODEL" \
    ${BARE[@]+"${BARE[@]}"} \
    --setting-sources project --disable-slash-commands \
    --mcp-config "$config" --strict-mcp-config \
    --allowed-tools "mcp__pachca" \
    --tools "ToolSearch" \
    --output-format stream-json --verbose < /dev/null > "$RAW/$id.jsonl" 2>/dev/null || true

  python3 - "$OUT" "$id" "$record" "$first" "$RAW/$id.jsonl" "$started" <<'PY'
import json, sys, os, re
out, ask_id, record, first, stream = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4] == "1", sys.argv[5]
ran_at = int(sys.argv[6])
calls = [json.loads(line) for line in open(record, encoding="utf-8")] if os.path.exists(record) else []

events = []
if os.path.exists(stream):
    for line in open(stream, encoding="utf-8"):
        line = line.strip()
        if not line:
            continue
        try:
            events.append(json.loads(line))
        except ValueError:
            pass

def blocks(event):
    content = (event.get("message") or {}).get("content")
    return content if isinstance(content, list) else []

def as_text(content):
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "\n".join(b.get("text", "") if isinstance(b, dict) and b.get("type") == "text" else json.dumps(b, ensure_ascii=False) for b in content)
    return json.dumps(content, ensure_ascii=False)

# The answer is what the result event says; every call the model made, and what
# came back, is in the assistant and user events before it.
text = next((e.get("result") or "" for e in reversed(events) if e.get("type") == "result"), "")
uses = {}
for e in events:
    if e.get("type") == "assistant":
        for b in blocks(e):
            if b.get("type") == "tool_use":
                uses[b.get("id")] = b
searched, loaded, client_errors = [], [], []
PREFIX = "mcp__pachca__"
for e in events:
    if e.get("type") != "user":
        continue
    for b in blocks(e):
        if b.get("type") != "tool_result":
            continue
        use = uses.get(b.get("tool_use_id")) or {}
        name = use.get("name") or ""
        body = as_text(b.get("content"))
        if name == "ToolSearch":
            searched.append((use.get("input") or {}).get("query", ""))
            for found in re.findall(PREFIX + r"(\w+)", json.dumps(b.get("content"), ensure_ascii=False)):
                if found not in loaded:
                    loaded.append(found)
        # Every answer of the server ends with its footer, refusals included: an
        # error without one never reached it.
        elif name.startswith(PREFIX) and b.get("is_error") and "Now: " not in body:
            client_errors.append({"name": name[len(PREFIX):], "error": body[:300]})

row = {
    "id": ask_id,
    "ran_at": ran_at,
    "calls": [
        {"name": c.get("name"), "arguments": c.get("arguments") or {}, **({"refused": c["refused"]} if c.get("refused") else {})}
        for c in calls
    ],
    "text": text.strip()[:4000],
    "searched": searched,
    "loaded": loaded,
    "client_errors": client_errors,
}
with open(out, "a", encoding="utf-8") as f:
    f.write(("" if first else ",\n") + json.dumps(row, ensure_ascii=False))
PY
  first=0
  printf '.'
done

echo "]" >> "$OUT"
echo
echo "written: $OUT (raw streams in $RAW)"
