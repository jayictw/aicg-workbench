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

// src/stage3d/pose-library-state.ts
var pose_library_state_exports = {};
__export(pose_library_state_exports, {
  changedRecord: () => changedRecord,
  decodePoses: () => decodePoses,
  encodePoses: () => encodePoses,
  libraryError: () => libraryError,
  libraryLimits: () => libraryLimits,
  makePoseRecord: () => makePoseRecord,
  nameKey: () => nameKey,
  planPoseImport: () => planPoseImport,
  poseName: () => poseName,
  poseRig: () => poseRig,
  uniqueName: () => uniqueName,
  validateAdditions: () => validateAdditions,
  verifiedPose: () => verifiedPose,
  verifiedRecord: () => verifiedRecord
});
module.exports = __toCommonJS(pose_library_state_exports);

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

// src/stage3d/pose-library-state.ts
var poseRig = { id: "acs-rigid-mannequin", version: 1 };
var libraryLimits = { fileBytes: 1024 * 1024, records: 200, nameLength: 60, thumbnailBytes: 96 * 1024 };
var object = (x) => !!x && typeof x === "object" && !Array.isArray(x) && Object.getPrototypeOf(x) === Object.prototype;
function keys(x, allowed, label) {
  if (!object(x) || Object.keys(x).length !== allowed.length || Object.keys(x).some((k) => !allowed.includes(k))) throw new Error(`${label}\u5B57\u6BB5\u4E0D\u5B8C\u6574\u6216\u5305\u542B\u4E0D\u5141\u8BB8\u7684\u6570\u636E\u3002`);
}
function iso(x) {
  if (typeof x !== "string" || !Number.isFinite(Date.parse(x))) return false;
  return new Date(x).toISOString() === x;
}
function poseName(value) {
  const name = value.trim().normalize("NFC");
  if (!name || name.length > libraryLimits.nameLength || /[\u0000-\u001f\u007f]/u.test(name)) throw new Error("\u540D\u79F0\u9700\u4E3A1\u201360\u4E2A\u5B57\u7B26\uFF0C\u4E0D\u80FD\u5305\u542B\u63A7\u5236\u5B57\u7B26\u3002");
  return name;
}
var nameKey = (name) => name.normalize("NFKC").toLocaleLowerCase("en-US");
function verifiedPose(value) {
  keys(value, ["version", "joints"], "\u59FF\u52BF");
  if (value.version !== 1) throw new Error("\u4E0D\u652F\u6301\u7684\u59FF\u52BF\u7248\u672C\u3002");
  keys(value.joints, [...jointIds], "\u5173\u8282");
  for (const id of jointIds) {
    const r = value.joints[id];
    if (!Array.isArray(r) || r.length !== 3 || !r.every((n) => typeof n === "number" && Number.isFinite(n)) || r.some((n, i) => n !== limitRotation(id, r)[i])) throw new Error(`${id} \u7684\u89D2\u5EA6\u975E\u6709\u9650\u6570\u503C\u3001\u8F74\u65E0\u6548\u6216\u8D85\u51FA\u6D3B\u52A8\u8303\u56F4\uFF1B\u672A\u4FEE\u526A\u59FF\u52BF\u3002`);
  }
  return structuredClone(value);
}
function verifiedRig(value) {
  keys(value, ["id", "version"], "Rig");
  if (value.id !== poseRig.id || value.version !== poseRig.version) throw new Error("Rig\u4E0D\u517C\u5BB9\uFF1A\u4EC5\u652F\u6301\u5185\u7F6E\u5206\u6BB5\u4EBA\u5076 v1\uFF0C\u4E0D\u652F\u6301\u666E\u901AGLB\u3002");
}
var recordKeys = ["id", "name", "formatVersion", "rig", "pose", "createdAt", "updatedAt", "deletedAt", "revision", "thumbnail"];
function core(value) {
  keys(value, recordKeys, "\u59FF\u52BF\u8BB0\u5F55");
  if (typeof value.id !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(value.id)) throw new Error("\u59FF\u52BFID\u65E0\u6548\u3002");
  if (value.formatVersion !== 1) throw new Error("\u4E0D\u652F\u6301\u7684\u8D44\u6599\u683C\u5F0F\u7248\u672C\u3002");
  verifiedRig(value.rig);
  if (typeof value.name !== "string" || poseName(value.name) !== value.name) throw new Error("\u59FF\u52BF\u540D\u79F0\u683C\u5F0F\u65E0\u6548\u3002");
  if (!iso(value.createdAt) || !iso(value.updatedAt) || value.updatedAt < value.createdAt || !(value.deletedAt === null || iso(value.deletedAt) && value.deletedAt >= value.createdAt && value.deletedAt <= value.updatedAt)) throw new Error("\u5EFA\u7ACB\u3001\u66F4\u65B0\u65F6\u95F4\u6216\u56DE\u6536\u6807\u8BB0\u65E0\u6548\u3002");
  if (!Number.isSafeInteger(value.revision) || value.revision < 1 || value.revision > 1e9) throw new Error("\u8BB0\u5F55\u4FEE\u8BA2\u7248\u672C\u65E0\u6548\u3002");
  return { id: value.id, name: value.name, formatVersion: 1, rig: { ...poseRig }, pose: verifiedPose(value.pose), createdAt: value.createdAt, updatedAt: value.updatedAt, deletedAt: value.deletedAt, revision: value.revision };
}
function verifiedRecord(value) {
  const c = core(value), t = value.thumbnail;
  if (!object(t)) throw new Error("\u7F29\u56FE\u8BB0\u5F55\u65E0\u6548\u3002");
  if (t.status === "pending") {
    keys(t, ["status"], "\u7F29\u56FE");
    return { ...c, thumbnail: { status: "pending" } };
  }
  if (t.status === "error") {
    keys(t, ["status", "message"], "\u7F29\u56FE");
    if (typeof t.message !== "string" || t.message.length > 500) throw new Error("\u7F29\u56FE\u9519\u8BEF\u8BB0\u5F55\u65E0\u6548\u3002");
    return { ...c, thumbnail: { status: "error", message: t.message } };
  }
  if (t.status === "ready") {
    keys(t, ["status", "blob"], "\u7F29\u56FE");
    if (!(t.blob instanceof Blob) || t.blob.type !== "image/png" || !t.blob.size || t.blob.size > libraryLimits.thumbnailBytes) throw new Error("\u7F29\u56FE\u5FC5\u987B\u4E3A\u53D7\u9650\u5927\u5C0F\u7684\u672C\u5730PNG\u3002");
    return { ...c, thumbnail: { status: "ready", blob: t.blob } };
  }
  throw new Error("\u672A\u77E5\u7F29\u56FE\u72B6\u6001\u3002");
}
function makePoseRecord(name, pose, id = crypto.randomUUID(), now = (/* @__PURE__ */ new Date()).toISOString()) {
  return verifiedRecord({ id, name: poseName(name), formatVersion: 1, rig: { ...poseRig }, pose: verifiedPose(pose), createdAt: now, updatedAt: now, deletedAt: null, revision: 1, thumbnail: { status: "pending" } });
}
function changedRecord(record, changes) {
  const next = new Date(Math.max(Date.now(), Date.parse(record.updatedAt) + 1)).toISOString();
  return verifiedRecord({ ...structuredClone(record), ...changes, updatedAt: next, revision: record.revision + 1 });
}
function uniqueName(wanted, records) {
  const base = poseName(wanted), used = new Set(records.map((r) => nameKey(r.name)));
  let next = base, index = 2;
  while (used.has(nameKey(next))) {
    const suffix = `\uFF08${index++}\uFF09`;
    next = base.slice(0, libraryLimits.nameLength - suffix.length) + suffix;
  }
  return next;
}
function validateAdditions(existing, newRecords) {
  if (existing.length + newRecords.length > libraryLimits.records) throw new Error("\u59FF\u52BF\u5E93\u4E0A\u9650200\u6761\uFF08\u542B\u56DE\u6536\u533A\uFF09\uFF1B\u672C\u8F6E\u4E0D\u63D0\u4F9B\u6C38\u4E45\u6E05\u7A7A\u3002");
  const ids = new Set(existing.map((r) => r.id)), names = new Set(existing.map((r) => nameKey(r.name)));
  for (const row of newRecords) {
    verifiedRecord(row);
    if (ids.has(row.id)) throw new Error("ID\u5DF2\u5B58\u5728\uFF0C\u672A\u8986\u76D6\u3002");
    if (names.has(nameKey(row.name))) throw new Error("\u540D\u79F0\u5DF2\u5B58\u5728\uFF08\u542B\u56DE\u6536\u533A\uFF09\uFF0C\u8BF7\u6539\u540D\uFF1B\u672A\u8986\u76D6\u3002");
    ids.add(row.id);
    names.add(nameKey(row.name));
  }
}
function encodePoses(records) {
  if (!records.length) throw new Error("\u59FF\u52BF\u5E93\u4E3A\u7A7A\uFF0C\u6CA1\u6709\u53EF\u5BFC\u51FA\u7684\u8BB0\u5F55\u3002");
  const poses = records.map((r) => {
    const { thumbnail: _, ...data } = verifiedRecord(r);
    return { ...data, thumbnail: { status: "rebuild" } };
  });
  return JSON.stringify({ kind: "ai-creative-studio-pose-library", formatVersion: 1, rig: poseRig, exportedAt: (/* @__PURE__ */ new Date()).toISOString(), poses }, null, 2);
}
function decodePoses(text, bytes = new TextEncoder().encode(text).length) {
  if (bytes > libraryLimits.fileBytes) throw new Error("\u6587\u4EF6\u8D85\u8FC71MiB\uFF0C\u672A\u8BFB\u53D6\u5BFC\u5165\u3002");
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("JSON\u635F\u574F\u6216\u542BNaN\u7B49\u975E\u6CD5JSON\u6570\u503C\u3002");
  }
  keys(value, ["kind", "formatVersion", "rig", "exportedAt", "poses"], "\u5907\u4EFD");
  if (value.kind !== "ai-creative-studio-pose-library" || value.formatVersion !== 1) throw new Error("\u4E0D\u652F\u6301\u7684\u5907\u4EFD\u683C\u5F0F\u6216\u7248\u672C\u3002");
  verifiedRig(value.rig);
  if (!iso(value.exportedAt)) throw new Error("\u5907\u4EFD\u65F6\u95F4\u683C\u5F0F\u65E0\u6548\u3002");
  if (!Array.isArray(value.poses) || !value.poses.length || value.poses.length > libraryLimits.records) throw new Error("\u6BCF\u4E2A\u6587\u4EF6\u9700\u5305\u542B1\u2013200\u6761\u59FF\u52BF\u3002");
  const ids = /* @__PURE__ */ new Set();
  return value.poses.map((row, index) => {
    try {
      const c = core(row);
      keys(row.thumbnail, ["status"], "\u5916\u90E8\u7F29\u56FE");
      if (row.thumbnail.status !== "rebuild") throw new Error("\u4E0D\u63A5\u53D7\u5916\u90E8\u7F29\u56FE\u3001HTML\u3001SVG\u6216URL\uFF1B\u53EA\u53EF\u672C\u5730\u91CD\u5EFA\u3002");
      if (ids.has(c.id)) throw new Error("\u6587\u4EF6\u5185ID\u91CD\u590D\u3002");
      ids.add(c.id);
      return { ...c, thumbnail: { status: "rebuild" } };
    } catch (e) {
      throw new Error(`\u7B2C${index + 1}\u6761\uFF1A${e instanceof Error ? e.message : "\u8D44\u6599\u65E0\u6548"}`);
    }
  });
}
function planPoseImport(incoming, existing) {
  const occupied = [...existing];
  return incoming.map((row) => {
    const record = verifiedRecord({ ...row, id: crypto.randomUUID(), name: uniqueName(row.name, occupied), revision: 1, thumbnail: { status: "pending" } });
    occupied.push(record);
    return record;
  });
}
function libraryError(error) {
  const name = error instanceof Error ? error.name : "", message = error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF";
  if (name === "QuotaExceededError") return "\u50A8\u5B58\u914D\u989D\u4E0D\u8DB3\uFF0C\u672A\u5B8C\u6210\u672C\u6B21\u5199\u5165\uFF1B\u5F53\u524D\u59FF\u52BF\u4FDD\u7559\uFF0C\u53EF\u91CD\u8BD5\u6216\u5BFC\u51FA\u5F53\u524D\u59FF\u52BFJSON\u3002";
  if (name === "SecurityError" || name === "InvalidStateError") return "\u6D4F\u89C8\u5668\u50A8\u5B58\u4E0D\u53EF\u7528\uFF0C\u672A\u5B8C\u6210\u5199\u5165\uFF1B\u53EF\u68C0\u67E5\u6D4F\u89C8\u5668\u8BBE\u7F6E\u540E\u91CD\u8BD5\u6216\u5BFC\u51FA\u5F53\u524D\u59FF\u52BFJSON\u3002";
  return message;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  changedRecord,
  decodePoses,
  encodePoses,
  libraryError,
  libraryLimits,
  makePoseRecord,
  nameKey,
  planPoseImport,
  poseName,
  poseRig,
  uniqueName,
  validateAdditions,
  verifiedPose,
  verifiedRecord
});
