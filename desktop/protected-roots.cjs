'use strict';
const path=require('node:path'),crypto=require('node:crypto');
const invalid=()=>{throw Object.assign(Error('Invalid protected-root policy'),{code:'C6_PROTECTED_SOURCES'});};
const canonical=p=>{if(typeof p!=='string'||!path.isAbsolute(p))invalid();return path.resolve(p).toLowerCase();};
const digest=p=>crypto.createHash('sha256').update(p,'utf8').digest('hex');
function ancestors(p){const out=[];for(let q=canonical(p);;){out.push(q);const parent=path.dirname(q);if(parent===q)break;q=parent;}return out;}
function validatePolicy(p){if(!p||Object.getPrototypeOf(p)!==Object.prototype||Object.keys(p).sort().join(',')!=='ancestorHashes,kind,rootHashes,version'||p.kind!=='path-sha256/1'||p.version!==1)invalid();for(const key of ['rootHashes','ancestorHashes'])if(!Array.isArray(p[key])||!p[key].length||p[key].some(v=>typeof v!=='string'||!/^[a-f0-9]{64}$/.test(v))||new Set(p[key]).size!==p[key].length)invalid();return p;}
function makePortablePolicy(roots){if(!Array.isArray(roots)||!roots.length)invalid();const values=roots.map(canonical);return {version:1,kind:'path-sha256/1',rootHashes:[...new Set(values.map(digest))].sort(),ancestorHashes:[...new Set(values.flatMap(ancestors).map(digest))].sort()};}
function normalizeRoots(roots){if(!Array.isArray(roots))invalid();return roots.map(v=>typeof v==='string'?canonical(v):Object.freeze({...validatePolicy(v),rootHashes:Object.freeze([...v.rootHashes]),ancestorHashes:Object.freeze([...v.ancestorHashes])}));}
function isProtectedPath(target,roots,includeAncestors=false){const normalized=canonical(target),parents=ancestors(normalized),hashes=parents.map(digest),self=hashes[0];return roots.some(root=>{if(typeof root==='string'){const expected=canonical(root),under=(a,b)=>{const rel=path.relative(a,b);return !rel||rel!=='..'&&!rel.startsWith('..'+path.sep)&&!path.isAbsolute(rel);};return under(expected,normalized)||includeAncestors&&under(normalized,expected);}const p=validatePolicy(root);return hashes.some(h=>p.rootHashes.includes(h))||includeAncestors&&p.ancestorHashes.includes(self);});}
module.exports={makePortablePolicy,normalizeRoots,isProtectedPath,validatePolicy};
