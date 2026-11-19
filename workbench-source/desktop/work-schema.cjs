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

// src/stage3d/work-state.ts
var work_state_exports = {};
__export(work_state_exports, {
  stageWork: () => stageWork,
  validatePrompt: () => validatePrompt,
  validatePromptSource: () => validatePromptSource,
  validateWork: () => validateWork
});
module.exports = __toCommonJS(work_state_exports);

// src/stage3d/dof-state.ts
var dofLimits = { focusMin: 0.05, focusMax: 1e5, strengthMin: 0, strengthMax: 1, maxRadiusCssPx: 7 };
function dofIssues(value) {
  if (value === void 0) return [];
  if (!value || typeof value.enabled !== "boolean" || !Number.isFinite(value.focusDistance) || value.focusDistance < dofLimits.focusMin || value.focusDistance > dofLimits.focusMax || !Number.isFinite(value.strength) || value.strength < 0 || value.strength > 1) return ["\u666F\u6DF1\u9700\u4E3A\u6709\u6548\u5F00\u5173\u30010.05\u2013100000\u573A\u666F\u5355\u4F4D\u7684\u5BF9\u7126\u8DDD\u79BB\u53CA0\u20131\u865A\u5316\u5F3A\u5EA6\u3002"];
  return [];
}

// src/stage3d/lens-state.ts
var sensorHeightMm = 24;
var focalRange = { min: 18, max: 135 };
var legacyVerticalFov = 45;
var legacyFocalLengthMm = sensorHeightMm / (2 * Math.tan(legacyVerticalFov * Math.PI / 360));
var validFocalLength = (n) => typeof n === "number" && Number.isFinite(n) && n >= focalRange.min && n <= focalRange.max;

// src/stage3d/pose-state.ts
var jointIds = ["torso", "neck", "head", "leftShoulder", "leftElbow", "leftWrist", "rightShoulder", "rightElbow", "rightWrist", "leftHip", "leftKnee", "leftAnkle", "rightHip", "rightKnee", "rightAnkle"];
var jointDefinitions = {
  torso: { label: "\u8EAF\u5E72", group: "\u4E2D\u8F74", axes: { X: [-30, 35], Y: [-45, 45], Z: [-25, 25] } },
  neck: { label: "\u9888\u90E8", group: "\u4E2D\u8F74", axes: { X: [-35, 35], Y: [-60, 60], Z: [-25, 25] } },
  head: { label: "\u5934\u90E8", group: "\u4E2D\u8F74", axes: { X: [-20, 20], Y: [-30, 30], Z: [-15, 15] } },
  leftShoulder: { label: "\u5DE6\u80A9", group: "\u5DE6\u4FA7", axes: { X: [-150, 80], Y: [-90, 90], Z: [-30, 160] } },
  rightShoulder: { label: "\u53F3\u80A9", group: "\u53F3\u4FA7", axes: { X: [-150, 80], Y: [-90, 90], Z: [-160, 30] } },
  leftElbow: { label: "\u5DE6\u8098", group: "\u5DE6\u4FA7", axes: { X: [-145, 0] } },
  rightElbow: { label: "\u53F3\u8098", group: "\u53F3\u4FA7", axes: { X: [-145, 0] } },
  leftWrist: { label: "\u5DE6\u8155", group: "\u5DE6\u4FA7", axes: { X: [-60, 60], Z: [-30, 30] } },
  rightWrist: { label: "\u53F3\u8155", group: "\u53F3\u4FA7", axes: { X: [-60, 60], Z: [-30, 30] } },
  leftHip: { label: "\u5DE6\u9ACB", group: "\u5DE6\u4FA7", axes: { X: [-120, 45], Y: [-40, 40], Z: [-45, 45] } },
  rightHip: { label: "\u53F3\u9ACB", group: "\u53F3\u4FA7", axes: { X: [-120, 45], Y: [-40, 40], Z: [-45, 45] } },
  leftKnee: { label: "\u5DE6\u819D", group: "\u5DE6\u4FA7", axes: { X: [0, 145] } },
  rightKnee: { label: "\u53F3\u819D", group: "\u53F3\u4FA7", axes: { X: [0, 145] } },
  leftAnkle: { label: "\u5DE6\u8E1D", group: "\u5DE6\u4FA7", axes: { X: [-35, 45], Z: [-20, 20] } },
  rightAnkle: { label: "\u53F3\u8E1D", group: "\u53F3\u4FA7", axes: { X: [-35, 45], Z: [-20, 20] } }
};
function limitRotation(id, rotation) {
  return rotation.map((n, i) => {
    const range = jointDefinitions[id].axes[["X", "Y", "Z"][i]];
    return range ? Math.max(range[0], Math.min(range[1], Number.isFinite(n) ? n : 0)) : 0;
  });
}
function poseIssues(pose, root) {
  const issues = [];
  if (root && ![root.position, root.rotation].every((v) => Array.isArray(v) && v.length === 3 && v.every((n) => Number.isFinite(n) && Math.abs(n) <= 1e5))) issues.push("\u4E3B\u4F53\u6574\u4F53\u5750\u6807\u6216\u65CB\u8F6C\u65E0\u6548\u3002");
  if (pose && (pose.version !== 1 || !pose.joints || Object.keys(pose.joints).some((id) => !jointIds.includes(id)) || jointIds.some((id) => {
    const r = pose.joints[id];
    return !Array.isArray(r) || r.length !== 3 || r.some((n) => !Number.isFinite(n)) || r.some((n, i) => n !== limitRotation(id, r)[i]);
  }))) issues.push("\u4EBA\u7269\u59FF\u52BF\u6570\u636E\u65E0\u6548\u6216\u8D85\u51FA\u5173\u8282\u6D3B\u52A8\u8303\u56F4\u3002");
  return issues;
}

// src/stage3d/background-state.ts
var backgroundLimits = { fileBytes: 8 * 1024 * 1024, imageEdge: 4096, imagePixels: 8 * 1024 * 1024, hdrWidth: 1024, hdrHeight: 512, hdrPixels: 1024 * 512 };

// src/stage3d/state.ts
var sceneLimits = { fileBytes: 20 * 1024 * 1024, jsonBytes: 2 * 1024 * 1024, nodes: 256, primitives: 128, vertices: 15e4, triangles: 15e4, accessorBytes: 32 * 1024 * 1024, images: 8, imageBytes: 4 * 1024 * 1024, imageEdge: 2048, imagePixels: 16 * 1024 * 1024, depth: 32 };
var distance = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
function stageIssues(s) {
  const issues = [...poseIssues(s.pose, s.root), ...dofIssues(s.camera.depthOfField)];
  if (s.camera.focalLengthMm !== void 0 && !validFocalLength(s.camera.focalLengthMm)) issues.push("\u7126\u8DDD\u9700\u4E3A 18\u2013135mm \u7684\u6709\u9650\u6570\u503C\uFF1B\u539F\u6295\u5F71\u4FDD\u6301\uFF0C\u672A\u622A\u65AD\u3002");
  if (![s.camera.position, s.camera.rotation, s.light.position, s.light.rotation, s.target].every((v) => v.length === 3 && v.every((n) => Number.isFinite(n) && Math.abs(n) <= 1e5))) issues.push("\u5750\u6807\u6216\u89D2\u5EA6\u9700\u4E3A\u6709\u9650\u6570\u503C\uFF0C\u7EDD\u5BF9\u503C\u4E0D\u8D85\u8FC7 100000\u3002");
  if (distance(s.camera.position, s.target) < 0.05) issues.push("\u6444\u5F71\u673A\u8DDD\u76EE\u6807\u70B9\u81F3\u5C11 0.05 \u573A\u666F\u5355\u4F4D\uFF0C\u8BF7\u8C03\u6574\u6444\u5F71\u673A\u4F4D\u7F6E\u3002");
  if (s.light.aim === "target" && distance(s.light.position, s.target) < 0.05) issues.push("\u4E3B\u706F\u4E0D\u80FD\u4E0E\u76EE\u6807\u70B9\u91CD\u5408\uFF0C\u8BF7\u8C03\u6574\u4E3B\u706F\u4F4D\u7F6E\u3002");
  if (!(s.scale >= 0.1 && s.scale <= 10)) issues.push("\u4E3B\u4F53\u5305\u88C5\u7F29\u653E\u9700\u5728 0.1\u201310 \u4E4B\u95F4\u3002");
  if (!(s.light.power >= 0 && s.light.power <= 2e3 && s.ambient >= 0 && s.ambient <= 2)) issues.push("\u4E3B\u706F\u5F3A\u5EA6\u9700\u5728 0\u20132000\uFF0C\u73AF\u5883\u5149\u9700\u5728 0\u20132\u3002");
  if (!["1:1", "4:3", "3:4", "16:9", "9:16"].includes(s.ratio)) issues.push("\u8BF7\u9009\u62E9\u53D7\u652F\u6301\u7684\u753B\u5E45\u6BD4\u4F8B\u3002");
  if (!/^#[0-9a-fA-F]{6}$/.test(s.backdrop.color) || !Number.isFinite(s.backdrop.rotation) || Math.abs(s.backdrop.rotation) > 360 || ![s.backdrop.backgroundIntensity, s.backdrop.environmentIntensity].every((v) => Number.isFinite(v) && v >= 0 && v <= 5)) issues.push("\u80CC\u666F\u989C\u8272\u3001\u65CB\u8F6C\u6216\u5F3A\u5EA6\u65E0\u6548\u3002");
  if (s.backdrop.show && s.backdrop.mode === "image" && !s.backdrop.image) issues.push("\u8BF7\u5148\u5BFC\u5165\u56FE\u7247\u80CC\u666F\uFF0C\u6216\u5207\u6362\u7EAF\u8272\u3002");
  if ((s.backdrop.show && s.backdrop.mode === "hdr" || s.backdrop.lighting) && !s.backdrop.hdr) issues.push("\u8BF7\u5148\u5BFC\u5165HDR\uFF0C\u6216\u5173\u95EDHDR\u80CC\u666F/\u7167\u660E\u3002");
  return issues;
}

// src/stage3d/draft-state.ts
function keys(v, allowed) {
  if (!v || typeof v !== "object" || Array.isArray(v) || Object.keys(v).some((k) => !allowed.includes(k))) throw Error("SCENE_DRAFT_SCHEMA");
}
function validScene(v) {
  keys(v, ["version", "ratio", "subject", "normalize", "scale", "target", "root", "pose", "camera", "light", "ambient", "backdrop"]);
  if (![1, 2].includes(v.version) || typeof v.normalize !== "boolean" || !Number.isFinite(v.scale) || !Number.isFinite(v.ambient)) throw Error("SCENE_DRAFT_SCHEMA");
  keys(v.subject, v.subject.kind === "builtin" ? ["kind", "id"] : ["kind", "source", "id", "name", "size", "modified", ...v.version === 2 ? ["contentId"] : []]);
  if (v.subject.kind === "builtin") {
    if (!["person", "box", "cylinder"].includes(v.subject.id)) throw Error("SCENE_DRAFT_SUBJECT");
  } else if (v.subject.kind !== "glb" || !["local", "entity"].includes(v.subject.source) || !v.subject.id || typeof v.subject.name !== "string" || !Number.isSafeInteger(v.subject.size) || v.subject.size < 0 || !Number.isFinite(v.subject.modified)) throw Error("SCENE_DRAFT_SUBJECT");
  if (v.subject.kind === "glb" && v.version === 2 && (!/^m-[a-f0-9]{64}$/.test(v.subject.contentId || "") || v.subject.size < 28 || v.subject.size > 20 * 1024 * 1024)) throw Error("MODEL_BINDING_SCHEMA");
  keys(v.camera, ["position", "rotation", "aim", "focalLengthMm", "depthOfField"]);
  keys(v.light, ["position", "rotation", "aim", "power"]);
  if (!["free", "target"].includes(v.camera.aim) || !["free", "target"].includes(v.light.aim)) throw Error("SCENE_DRAFT_AIM");
  if (v.root) keys(v.root, ["position", "rotation"]);
  if (v.pose) {
    keys(v.pose, ["version", "joints"]);
    if (v.pose.version !== 1) throw Error("SCENE_DRAFT_POSE");
  }
  if (v.camera.depthOfField) keys(v.camera.depthOfField, ["enabled", "focusDistance", "strength"]);
  keys(v.backdrop, ["mode", "show", "color", "image", "fit", "hdr", "rotation", "backgroundIntensity", "lighting", "environmentIntensity", "ground"]);
  if (!["color", "image", "hdr"].includes(v.backdrop.mode) || !["cover", "contain"].includes(v.backdrop.fit) || ["show", "lighting", "ground"].some((k) => typeof v.backdrop[k] !== "boolean")) throw Error("SCENE_DRAFT_BACKDROP");
  for (const kind of ["image", "hdr"]) {
    const ref = v.backdrop[kind];
    if (ref) {
      keys(ref, ["kind", "id", "name", "size", "modified"]);
      if (ref.kind !== kind || !ref.id || typeof ref.name !== "string" || !Number.isSafeInteger(ref.size) || !Number.isFinite(ref.modified)) throw Error("SCENE_DRAFT_FILE");
    }
  }
  const issues = stageIssues(v);
  if (issues.length) throw Error("SCENE_DRAFT_INVALID: " + issues.join("\uFF1B"));
}

// src/stage3d/work-state.ts
var listeners = /* @__PURE__ */ new Set();
var lib = "browser-session";
var epoch = 0;
var records = {};
var copy = (v) => structuredClone(v);
var emit = () => listeners.forEach((f) => f());
var keys2 = (v, allowed) => {
  if (!v || typeof v !== "object" || Array.isArray(v) || Object.keys(v).some((k) => !allowed.includes(k))) throw Error("STAGE_WORK_SCHEMA");
};
var date = (s) => typeof s === "string" && Number.isFinite(Date.parse(s));
function validatePromptSource(s, id, encoded = false) {
  keys2(s, ["version", "id", "kind", "task", "at", "scene", "evidence", "sceneSignature"]);
  if (s.version !== 1 || typeof s.id !== "string" || !s.id || !["draft", "output"].includes(s.kind) || s.task?.id !== id || !["image", "video"].includes(s.task.kind) || typeof s.task.name !== "string" || !date(s.at) || (!encoded || typeof s.sceneSignature === "string" ? s.sceneSignature !== JSON.stringify(s.scene) : !s.sceneSignature?.$evidence)) throw Error("STAGE_WORK_SOURCE");
  validScene(s.scene);
  if (!s.evidence || !["outside", "intersects", "unavailable"].includes(s.evidence.composition?.state) || !["off", "active", "fallback", "unknown"].includes(s.evidence.effect?.state) || typeof s.evidence.effect.reason !== "string" || s.evidence.light?.type !== "SpotLight") throw Error("STAGE_WORK_EVIDENCE");
}
function validatePrompt(d, id, encoded = false) {
  keys2(d, ["version", "ruleVersion", "source", "at", "sections", "originalSections", "manualText", "unacknowledged"]);
  if (d.version !== 1 || d.ruleVersion !== "scene-prompt.zh.v1" || !date(d.at) || d.manualText !== null && typeof d.manualText !== "string" || typeof d.unacknowledged !== "boolean") throw Error("STAGE_WORK_PROMPT");
  validatePromptSource(d.source, id, encoded);
  for (const a of [d.sections, d.originalSections]) {
    if (!Array.isArray(a) || a.length !== 5 || new Set(a.map((s) => s.id)).size !== 5) throw Error("STAGE_WORK_SECTIONS");
    for (const s of a) {
      keys2(s, ["id", "label", "text", "enabled"]);
      if (!["camera", "pose", "light", "background", "dof"].includes(s.id) || typeof s.label !== "string" || typeof s.text !== "string" || typeof s.enabled !== "boolean") throw Error("STAGE_WORK_SECTIONS");
    }
  }
}
function validateWork(list, libraryId, tasks, binary = true) {
  if (!Array.isArray(list)) throw Error("STAGE_WORK_SCHEMA");
  const seen = /* @__PURE__ */ new Set();
  for (const d of list) {
    keys2(d, ["version", "libraryId", "projectId", "taskId", "prompt", "selectedSource", "result", "selectedOutputId", "attempt"]);
    const task = tasks.find((t) => t.id === d.taskId);
    if (d.version !== 1 || d.libraryId !== libraryId || !task || d.projectId !== (task.projectId || null) || seen.has(d.taskId) || !["draft", "output"].includes(d.selectedSource)) throw Error("STAGE_WORK_SCOPE");
    seen.add(d.taskId);
    if (d.prompt) validatePrompt(d.prompt, d.taskId, !binary);
    if (d.result) {
      const o = d.result;
      keys2(o, ["id", "blob", "width", "height", "effect", "signature", "at", "filename", "scene", "promptSnapshot"]);
      validScene(o.scene);
      const [w, h] = o.scene.ratio.split(":").map(Number), long = Math.max(o.width, o.height);
      if (!o.id || d.selectedOutputId !== o.id || ![1024, 2048].includes(long) || o.width !== Math.round(long * w / Math.max(w, h)) || o.height !== Math.round(long * h / Math.max(w, h)) || o.signature !== JSON.stringify(o.scene) || !date(o.at) || typeof o.filename !== "string" || !o.filename.endsWith(".png") || !["off", "active", "fallback"].includes(o.effect?.state) || typeof o.effect.reason !== "string") throw Error("STAGE_WORK_OUTPUT");
      if (binary && (!(o.blob instanceof Blob) || o.blob.type !== "image/png" || !o.blob.size || o.blob.size > 32 * 1024 * 1024)) throw Error("STAGE_WORK_PNG");
      if (o.promptSnapshot) {
        validatePromptSource(o.promptSnapshot, d.taskId, !binary);
        if (o.promptSnapshot.kind !== "output" || o.promptSnapshot.id !== o.id || (binary || typeof o.promptSnapshot.sceneSignature === "string") && o.promptSnapshot.sceneSignature !== o.signature) throw Error("STAGE_WORK_OUTPUT_SOURCE");
      }
    } else if (d.selectedOutputId !== null) throw Error("STAGE_WORK_SELECTION");
    if (d.attempt) {
      const a = d.attempt;
      keys2(a, ["id", "scene", "size", "startedAt", "status", "error"]);
      validScene(a.scene);
      if (!a.id || !date(a.startedAt) || ![1024, 2048].includes(a.size) || !["running", "failed", "cancelled", "interrupted"].includes(a.status) || typeof a.error !== "string") throw Error("STAGE_WORK_ATTEMPT");
    }
  }
}
function entry(taskId, projectId) {
  const old = records[taskId];
  if (old && (old.libraryId !== lib || old.projectId !== projectId)) throw Error("STAGE_WORK_SCOPE");
  return old || { version: 1, libraryId: lib, projectId, taskId, prompt: null, selectedSource: "draft", result: null, selectedOutputId: null, attempt: null };
}
var stageWork = {
  subscribe: (f) => {
    listeners.add(f);
    return () => {
      listeners.delete(f);
    };
  },
  get: (id) => records[id],
  list: () => copy(Object.values(records)),
  ticket: () => epoch,
  library: () => lib,
  bind(id, list = [], tasks = []) {
    validateWork(list, id, tasks);
    epoch++;
    lib = id;
    records = Object.fromEntries(copy(list).map((d) => [d.taskId, d]));
    emit();
  },
  update(id, projectId, patch, ticket = epoch) {
    if (ticket !== epoch) return false;
    records = { ...records, [id]: { ...entry(id, projectId), ...copy(patch) } };
    emit();
    return true;
  },
  removePrompt(id) {
    const d = records[id];
    if (d) stageWork.update(id, d.projectId, { prompt: null, selectedSource: "draft" });
  },
  removeOutput(id) {
    const d = records[id];
    if (d) stageWork.update(id, d.projectId, { result: null, selectedOutputId: null, attempt: null });
  },
  scenes(list = Object.values(records)) {
    const out = {};
    for (const d of list) {
      if (d.prompt) out["prompt:" + d.taskId] = d.prompt.source.scene;
      if (d.result) out["result:" + d.taskId] = d.result.scene;
      if (d.result?.promptSnapshot) out["result-prompt:" + d.taskId] = d.result.promptSnapshot.scene;
      if (d.attempt) out["attempt:" + d.taskId] = d.attempt.scene;
    }
    return out;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  stageWork,
  validatePrompt,
  validatePromptSource,
  validateWork
});
