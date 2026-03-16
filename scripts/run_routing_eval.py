#!/usr/bin/env python3
"""Run routing evaluation for Pachca skills.

Registers ALL skills as command files simultaneously, then tests whether
Claude routes each query to the correct skill. Unlike trigger evals (which
test one skill in isolation), this tests the full routing decision.

Outputs results as JSON to stdout.
"""

import argparse
import json
import os
import subprocess
import sys
import time
import uuid
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

sys.path.insert(0, "/tmp/anthropic-skills/skills/skill-creator")
from scripts.utils import parse_skill_md


def find_project_root() -> Path:
    current = Path.cwd()
    for parent in [current, *current.parents]:
        if (parent / ".claude").is_dir():
            return parent
    return current


def setup_all_skills(skills_dir: Path, project_root: Path, unique_id: str) -> dict[str, str]:
    """Register all skills as command files. Returns {clean_name: skill_name}."""
    commands_dir = project_root / ".claude" / "commands"
    commands_dir.mkdir(parents=True, exist_ok=True)

    skill_map = {}

    for skill_path in sorted(skills_dir.iterdir()):
        if not skill_path.is_dir():
            continue
        skill_md = skill_path / "SKILL.md"
        if not skill_md.exists():
            continue

        skill_name = skill_path.name
        # Skip router skill
        if skill_name == "pachca":
            continue

        name, description, content = parse_skill_md(skill_path)
        clean_name = f"{skill_name}-{unique_id}"
        skill_map[clean_name] = skill_name

        indented_desc = "\n  ".join(description.split("\n"))
        command_content = (
            f"---\n"
            f"description: |\n"
            f"  {indented_desc}\n"
            f"---\n\n"
            f"# {skill_name}\n\n"
            f"This skill handles: {description}\n"
        )
        (commands_dir / f"{clean_name}.md").write_text(command_content)

    return skill_map


def cleanup_skills(project_root: Path, unique_id: str):
    """Remove all command files for this eval run."""
    commands_dir = project_root / ".claude" / "commands"
    if not commands_dir.exists():
        return
    for f in commands_dir.iterdir():
        if unique_id in f.name:
            f.unlink()


def run_single_query(
    query: str,
    unique_id: str,
    skill_map_json: str,
    timeout: int,
    project_root: str,
    model: str | None = None,
) -> str | None:
    """Run a single query and return which skill was selected (or None).

    Uses subprocess.run (not Popen) for reliable output capture.
    Parses stream-json output to find which Skill tool was called.
    """
    skill_map = json.loads(skill_map_json)

    cmd = [
        "claude",
        "-p", query,
        "--output-format", "stream-json",
        "--verbose",
        "--max-turns", "1",
    ]
    if model:
        cmd.extend(["--model", model])

    env = {k: v for k, v in os.environ.items() if k != "CLAUDECODE"}

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=project_root,
            env=env,
        )
    except subprocess.TimeoutExpired:
        return None

    if not result.stdout.strip():
        return None

    for line in result.stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue

        if event.get("type") == "assistant":
            for content_item in event.get("message", {}).get("content", []):
                if content_item.get("type") != "tool_use":
                    continue
                tool_name = content_item.get("name", "")
                if tool_name not in ("Skill", "Read"):
                    continue
                input_str = json.dumps(content_item.get("input", {}))
                for clean_name, skill_name in skill_map.items():
                    if clean_name in input_str:
                        return skill_name

    return None


def run_eval(
    eval_set: list[dict],
    skills_dir: Path,
    num_workers: int,
    timeout: int,
    project_root: Path,
    runs_per_query: int = 1,
    model: str | None = None,
    verbose: bool = False,
) -> dict:
    """Run the full routing eval set."""
    unique_id = uuid.uuid4().hex[:8]
    skill_map = setup_all_skills(skills_dir, project_root, unique_id)
    skill_map_json = json.dumps(skill_map)

    if verbose:
        print(f"Registered {len(skill_map)} skills: {list(skill_map.values())}", file=sys.stderr)

    try:
        results = []

        with ThreadPoolExecutor(max_workers=num_workers) as executor:
            future_to_info = {}
            for item in eval_set:
                for run_idx in range(runs_per_query):
                    future = executor.submit(
                        run_single_query,
                        item["query"],
                        unique_id,
                        skill_map_json,
                        timeout,
                        str(project_root),
                        model,
                    )
                    future_to_info[future] = (item, run_idx)

            query_results: dict[str, list[str | None]] = {}
            query_items: dict[str, dict] = {}
            done_count = 0
            total_count = len(future_to_info)

            for future in as_completed(future_to_info):
                item, _ = future_to_info[future]
                query = item["query"]
                query_items[query] = item
                if query not in query_results:
                    query_results[query] = []
                try:
                    query_results[query].append(future.result())
                except Exception as e:
                    if verbose:
                        print(f"Warning: query failed: {e}", file=sys.stderr)
                    query_results[query].append(None)

                done_count += 1
                if verbose and done_count % 10 == 0:
                    print(f"  Progress: {done_count}/{total_count}", file=sys.stderr)

        for query, selected_skills in query_results.items():
            item = query_items[query]
            expected = item["expected_skill"]

            # Count which skill was selected most often
            counter = Counter(selected_skills)
            most_common_skill, most_common_count = counter.most_common(1)[0]
            correct_count = sum(1 for s in selected_skills if s == expected)
            accuracy = correct_count / len(selected_skills)

            results.append({
                "query": query,
                "expected_skill": expected,
                "most_common_skill": most_common_skill,
                "correct_count": correct_count,
                "runs": len(selected_skills),
                "accuracy": accuracy,
                "correct": accuracy >= 0.5,
                "all_selections": selected_skills,
                "note": item.get("note", ""),
            })

            if verbose:
                status = "OK" if accuracy >= 0.5 else "FAIL"
                print(
                    f"  [{status}] expected={expected} got={most_common_skill} "
                    f"({correct_count}/{len(selected_skills)}): {query[:60]}",
                    file=sys.stderr,
                )

        correct = sum(1 for r in results if r["correct"])
        wrong_skill = sum(
            1 for r in results
            if not r["correct"] and r["most_common_skill"] is not None
        )
        no_skill = sum(
            1 for r in results
            if not r["correct"] and r["most_common_skill"] is None
        )
        total = len(results)

        return {
            "eval_type": "routing",
            "skills_registered": list(skill_map.values()),
            "results": results,
            "summary": {
                "total": total,
                "correct": correct,
                "wrong_skill": wrong_skill,
                "no_skill": no_skill,
                "accuracy": correct / total if total > 0 else 0,
            },
        }

    finally:
        cleanup_skills(project_root, unique_id)


def main():
    parser = argparse.ArgumentParser(description="Run routing evaluation for Pachca skills")
    parser.add_argument("--eval-set", required=True, help="Path to routing eval set JSON")
    parser.add_argument("--skills-dir", required=True, help="Path to skills/ directory")
    parser.add_argument("--num-workers", type=int, default=5, help="Parallel workers")
    parser.add_argument("--timeout", type=int, default=30, help="Timeout per query (seconds)")
    parser.add_argument("--runs-per-query", type=int, default=1, help="Runs per query")
    parser.add_argument("--model", default=None, help="Model override")
    parser.add_argument("--verbose", action="store_true", help="Print progress to stderr")
    args = parser.parse_args()

    eval_set = json.loads(Path(args.eval_set).read_text())
    skills_dir = Path(args.skills_dir)

    project_root = find_project_root()

    if args.verbose:
        print(f"Eval set: {len(eval_set)} queries", file=sys.stderr)
        print(f"Skills dir: {skills_dir}", file=sys.stderr)
        print(f"Project root: {project_root}", file=sys.stderr)

    output = run_eval(
        eval_set=eval_set,
        skills_dir=skills_dir,
        num_workers=args.num_workers,
        timeout=args.timeout,
        project_root=project_root,
        runs_per_query=args.runs_per_query,
        model=args.model,
        verbose=args.verbose,
    )

    if args.verbose:
        s = output["summary"]
        print(f"\nSummary: {s['correct']}/{s['total']} correct ({s['accuracy']:.1%})", file=sys.stderr)

    print(json.dumps(output, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
