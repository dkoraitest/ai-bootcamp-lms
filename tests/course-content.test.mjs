import assert from "node:assert/strict";
import test from "node:test";
import { loadTypeScriptModule } from "./helpers/load-ts.mjs";

const { PROGRAM_ASSIGNMENTS } = loadTypeScriptModule("src/lib/program/assignments.ts");

test("Исходная редакция ДЗ 5 сохранена для остальных потоков", () => {
  const assignment = PROGRAM_ASSIGNMENTS.find((item) => item.hwNumber === 5);
  assert.ok(assignment, "ДЗ 5 должно существовать");

  const visibleContract = [
    assignment.description,
    ...assignment.requirements,
    ...assignment.checklist.map((item) => item.text),
  ].join("\n");

  assert.match(visibleContract, /SECURITY_REPORT\.md/);
  assert.match(visibleContract, /dummy-target/);
  assert.match(visibleContract, /CASE_BRIEF\.md/);
  assert.match(visibleContract, /30 минут/);
  assert.match(visibleContract, /PASS/);
  assert.match(visibleContract, /blocker/i);
  assert.doesNotMatch(visibleContract, /два хука/i);
});
