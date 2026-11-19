"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/generated/daily-input.ts
var daily_input_exports = {};
__export(daily_input_exports, {
  adoptSnapshot: () => adoptSnapshot,
  dailyText: () => dailyText,
  modeNames: () => modeNames,
  referencePurpose: () => referencePurpose
});
module.exports = __toCommonJS(daily_input_exports);
var modeNames = { C: "\u56FE\u7247\uFF0B\u8865\u5145\u6587\u5B57", B: "\u53EA\u7528\u6444\u5F71\u68DA\u56FE\u7247", A: "\u53EA\u7528\u8865\u5145\u6587\u5B57", BASE: "\u4E0D\u7528\u6444\u5F71\u68DA" };
var referencePurpose = "\u53C2\u8003\u56FE\u7528\u4E8E\u6784\u56FE\u3001\u9759\u6001\u59FF\u52BF\u4E0E\u7A7A\u95F4\u5173\u7CFB\uFF1B\u4EBA\u7269\u8EAB\u4EFD\u548C\u6750\u8D28\u7531\u539F\u59CB\u521B\u610F\u51B3\u5B9A\u3002";
function dailyText(original, adopted, mode) {
  return [original, ...["A", "C"].includes(mode) ? [adopted] : [], ...["B", "C"].includes(mode) ? [referencePurpose] : []].filter((x) => x.trim()).join("\n\n");
}
function adoptSnapshot(old, sourceJson, automaticText, outputId, referenceSha256, keep) {
  return { version: 1, mode: old?.chosen ? old.mode : "B", chosen: old?.chosen || false, sourceJson, automaticText, adoptedText: keep && old ? old.adoptedText : automaticText, outputId, referenceSha256 };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  adoptSnapshot,
  dailyText,
  modeNames,
  referencePurpose
});
