// Разбор manifest.browser совпадает с платформой: оба читают contract/browser-hosts.json.
import assert from "node:assert/strict";
import { test } from "vitest";
import { readFileSync } from "node:fs";
import { browserHostError, browserHostProblems } from "../src/hosts.ts";

const cases = JSON.parse(readFileSync(new URL("../contract/browser-hosts.json", import.meta.url), "utf8")) as { ok: string[]; bad: string[] };

test("browser: те же хосты подходят и отклоняются, что у платформы", () => {
  for (const h of cases.ok) assert.equal(browserHostError(h), null, h);
  for (const h of cases.bad) assert.equal(browserHostProblems([h]).length, 1, JSON.stringify(h));
});

test("browser: ошибка называет хост и причину, регистр не важен", () => {
  assert.deepEqual(browserHostProblems(["https://tiles.example.com"]), ['манифест: browser: "https://tiles.example.com": без схемы: только хост']);
  assert.match(browserHostProblems(["*.com"])[0]!, /первого уровня/);
  assert.match(browserHostProblems(["*"])[0]!, /любой хост/);
  assert.deepEqual(browserHostProblems(["Tiles.Example.com", undefined as never].filter(Boolean)), []);
  assert.deepEqual(browserHostProblems(undefined), []);
  assert.equal(browserHostProblems(Array.from({ length: 21 }, (_, i) => `h${i}.example.com`)).length, 1);
});
