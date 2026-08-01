import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Buffer } from "node:buffer";
import ts from "typescript";

const sourceUrl = new URL("../src/lib/promotionEngine.ts", import.meta.url);
const source = await readFile(sourceUrl, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`;
const {
  getEligiblePromotionBenefitQuantity,
  getPromotionalTriggerThreshold,
} = await import(moduleUrl);

const repeatEveryOne = { requiredCount: 1, triggerCount: 1, repeatable: true };
const repeatEveryTwo = { requiredCount: 2, triggerCount: 2, repeatable: true };
const singleUse = { requiredCount: 1, triggerCount: 1, repeatable: false };
const legacyTriggerCount = { requiredCount: 0, triggerCount: 3, repeatable: true };

assert.equal(getPromotionalTriggerThreshold(repeatEveryOne), 1);
assert.equal(getEligiblePromotionBenefitQuantity(repeatEveryOne, 5), 5);
assert.equal(getEligiblePromotionBenefitQuantity(repeatEveryTwo, 5), 2);
assert.equal(getEligiblePromotionBenefitQuantity(repeatEveryTwo, 1), 0);
assert.equal(getEligiblePromotionBenefitQuantity(singleUse, 5), 1);
assert.equal(getPromotionalTriggerThreshold(legacyTriggerCount), 3);
assert.equal(getEligiblePromotionBenefitQuantity(legacyTriggerCount, 7), 2);

console.log("V22.2 promotion repeatability QA passed.");
