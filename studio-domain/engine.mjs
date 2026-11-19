import { builtinPersonSource } from './spatial-state.mjs';
import { promptGeometry } from './scene-prompt-geometry.mjs';
import { referenceSize, referenceSignature } from './reference-state.mjs';
import { dofOf, dofLimits, shootingFrame, shootingViewportPoint } from './dof-state.mjs';
import { ShootingRenderer } from './shooting-renderer.mjs';
import { focalLengthOf, sensorHeightMm, validFocalLength, verticalFov } from './lens-state.mjs';
import { createMannequin, applyPose } from './mannequin.mjs';
import { jointDefinitions, jointIds, limitRotation, poseOf, rootOf, setJoint } from './pose-state.mjs';
import { StageBackdrop } from './background-engine.mjs';
import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RevisionGate, sceneLimits } from './state.mjs';
const radians = (v) => v * Math.PI / 180, degrees = (v) => v * 180 / Math.PI;
const tuple = (v) => [v.x, v.y, v.z];
const lifecycle = { created: 0, disposed: 0, active: 0, pendingFrames: 0, workers: 0, lastReleased: [] };
const publish = () => { document.documentElement.dataset.stage3dLifecycle = JSON.stringify(lifecycle); };
const layer = (object) => { object.traverse(n => n.layers.set(1)); return object; };
export function releaseObject(object) {
    const resources = new Set(), images = new Set(), skeletons = new Set();
    object.traverse(n => { const mesh = n; if (mesh.geometry)
        resources.add(mesh.geometry); for (const m of Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : []) {
        resources.add(m);
        for (const value of Object.values(m))
            if (value instanceof T.Texture) {
                resources.add(value);
                if (value.image)
                    images.add(value.image);
            }
    } ; if (n instanceof T.SkinnedMesh)
        skeletons.add(n.skeleton); });
    skeletons.forEach(s => s.dispose());
    resources.forEach(r => r.dispose());
    images.forEach(i => { if (typeof i.close === 'function')
        i.close(); });
}
const workers = new Set();
function workerInspect(file, signal) {
    if (!file.name.toLowerCase().endsWith('.glb') || !file.size || file.size > sceneLimits.fileBytes)
        return Promise.reject(new Error('请选择非空 .glb 文件，最大20 MiB。'));
    return new Promise((resolve, reject) => {
        const worker = new Worker(new URL('./glb-worker.ts', import.meta.url), { type: 'module' });
        workers.add(worker);
        lifecycle.workers++;
        publish();
        const stop = () => { signal?.removeEventListener('abort', abort); clearTimeout(timer); if (workers.delete(worker)) {
            worker.terminate();
            lifecycle.workers--;
            publish();
        } };
        const timer = window.setTimeout(() => { stop(); reject(new Error('GLB 预检超过8秒，已停止；请使用更小的模型。')); }, 8000);
        const abort = () => { stop(); reject(new Error('已取消较早的主体加载。')); };
        signal?.addEventListener('abort', abort, { once: true });
        if (signal?.aborted) {
            abort();
            return;
        }
        worker.onmessage = e => { stop(); e.data.ok ? resolve({ buffer: e.data.buffer, info: e.data.info }) : reject(new Error(e.data.message)); };
        worker.onerror = () => { stop(); reject(new Error('GLB 预检工作线程无法运行。')); };
        file.arrayBuffer().then(buffer => { if (workers.has(worker))
            worker.postMessage(buffer, [buffer]); }).catch(e => { stop(); reject(e); });
    });
}
export async function readGLB(file, signal) {
    const { buffer, info } = await workerInspect(file, signal);
    const contentId = 'm-' + Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', buffer))).map(v => v.toString(16).padStart(2, '0')).join('');
    const manager = new T.LoadingManager();
    // The preflight rejects every URI; this second boundary also rejects unexpected requests.
    manager.setURLModifier(url => { if (!url.startsWith('blob:'))
        throw new Error('已阻止模型外部资源请求。'); return url; });
    let parser;
    const loader = new GLTFLoader(manager).register(p => { parser = p; return { name: 'AICGResourceScope' }; });
    try {
        const gltf = await loader.parseAsync(buffer, '');
        // One scene only is enforced by preflight; shared resources are not disposed prematurely.
        const box = new T.Box3().setFromObject(gltf.scene), size = box.getSize(new T.Vector3()), max = Math.max(size.x, size.y, size.z);
        if (!Number.isFinite(max) || max < .000001 || max > 10000) {
            releaseObject(gltf.scene);
            throw new Error('主体包围盒为空、非有限或超出本轮原始范围（最长边0.000001–10000场景单位）。');
        }
        gltf.scene.traverse(n => { if (n instanceof T.Mesh) {
            n.castShadow = true;
            n.receiveShadow = true;
        } });
        return { object: gltf.scene, info, contentId };
    }
    catch (error) {
        // Resolve cached partial dependencies and release decoded bitmaps/materials on loader errors.
        if (parser) {
            const p = parser;
            const jobs = [];
            for (const [type, key] of [['texture', 'textures'], ['material', 'materials'], ['mesh', 'meshes']])
                for (let i = 0; i < (p.json[key]?.length || 0); i++)
                    jobs.push(p.getDependency(type, i));
            const settled = await Promise.allSettled(jobs);
            for (const item of settled)
                if (item.status === 'fulfilled') {
                    const v = item.value;
                    if (v instanceof T.Object3D)
                        releaseObject(v);
                    else if (v instanceof T.Texture) {
                        v.image?.close?.();
                        v.dispose();
                    }
                    else if (v instanceof T.Material)
                        v.dispose();
                }
        }
        throw new Error(`GLB 解析失败，请重新导出有效的单场景核心 GLB。详情：${error instanceof Error ? error.message : '未知解析错误'}`);
    }
}
function builtin(kind) {
    const group = new T.Group(), make = (g, color, position) => { const m = new T.Mesh(g, new T.MeshStandardMaterial({ color, roughness: .57, metalness: .06 })); m.position.fromArray(position); m.castShadow = true; m.receiveShadow = true; group.add(m); return m; };
    if (kind === 'box') {
        make(new T.BoxGeometry(1.4, 1.8, 1), 0xb6b0a1, [0, .9, 0]);
        make(new T.BoxGeometry(.8, .5, .08), 0xc1653e, [0, 1.1, .54]);
        make(new T.BoxGeometry(.18, .2, .2), 0x4d766d, [.48, 1.86, .15]);
    }
    if (kind === 'cylinder') {
        make(new T.CylinderGeometry(.62, .62, 1.8, 48), 0xa8b9b5, [0, .9, 0]);
        make(new T.BoxGeometry(.4, .45, .13), 0xd19a4c, [0, 1, .63]);
    }
    return group;
}
export class StageEngine {
    left;
    right;
    host;
    onMove;
    onFatal;
    onPoseChange;
    onJointSelect;
    onDofStatus;
    lastFocusPick;
    shooting;
    backdrop;
    scene = new T.Scene();
    editor = new T.PerspectiveCamera(45, 1, .05, 100000);
    camera = new T.PerspectiveCamera(45, 1, .02, 1000);
    light = new T.SpotLight(0xffffff, 240, 0, Math.PI / 5, .42, 2);
    ambient = new T.AmbientLight(0xffffff, .35);
    controls;
    transform;
    helper;
    floor;
    direction;
    frustum;
    renderers = [];
    observer;
    frame = 0;
    renders = 0;
    disposed = false;
    lost = false;
    editingLocked = false;
    lastRenderMs = 0;
    lastUpdateMs = 0;
    peopleRoot = new T.Group();
    peopleRigs = new Map();
    personId = null;
    personMove;
    personSelect;
    spatialReport;
    lastSpatialReport = '';
    subjectRoot = new T.Group();
    rig;
    poseEditing = false;
    joint = 'leftShoulder';
    subject;
    raw;
    rawBounds = new T.Box3();
    loadAbort;
    config;
    selected = 'camera';
    gate = new RevisionGate();
    modelContentId = null;
    modelBuiltin = null;
    modelEpoch = 0;
    configurationEpoch = 0;
    modelPending = false;
    get loadedContentId() { return this.modelContentId; }
    identityMatches(s) { if (s.version === 3)
        return !!s.people && s.people.persons.length === this.peopleRigs.size && s.people.persons.every(p => this.peopleRigs.has(p.id) && p.source.kind === builtinPersonSource.kind && p.source.id === builtinPersonSource.id && p.source.version === builtinPersonSource.version && p.source.sha256 === builtinPersonSource.sha256); return s.subject.kind === 'builtin' ? this.modelContentId === null && this.modelBuiltin === s.subject.id : s.version === 2 && !!s.subject.contentId && this.modelContentId === s.subject.contentId && this.modelBuiltin === null; }
    invalidateIdentity() { this.modelContentId = null; this.modelBuiltin = null; this.modelEpoch++; this.host.dataset.loadedContentId = ''; this.host.dataset.loadedBuiltin = ''; }
    assertModel(s, configuration = true) { if (this.disposed || this.lost || this.modelPending || !this.subject || !this.identityMatches(s) || configuration && referenceSignature(s) !== referenceSignature(this.config))
        throw Error('MODEL_NOT_READY: 目标内容尚未载入，保留原画面；请明确恢复对应场景。'); }
    contentStamp(s) { this.assertModel(s); return Object.freeze({ model: this.modelEpoch, configuration: this.configurationEpoch, signature: referenceSignature(s) }); }
    assertContentStamp(stamp, s) { this.assertModel(s); if (stamp.model !== this.modelEpoch || stamp.configuration !== this.configurationEpoch || stamp.signature !== referenceSignature(s))
        throw Error('MODEL_OUTPUT_EXPIRED'); }
    handlers = [];
    busy = () => { };
    dragHandler;
    constructor(left, right, host, onMove, onFatal, onPoseChange, onJointSelect, onDofStatus) {
        this.left = left;
        this.right = right;
        this.host = host;
        this.onMove = onMove;
        this.onFatal = onFatal;
        this.onPoseChange = onPoseChange;
        this.onJointSelect = onJointSelect;
        this.onDofStatus = onDofStatus;
        this.dragHandler = e => { this.controls.enabled = !e.value; this.updateDiagnostics(); };
        lifecycle.created++;
        lifecycle.active++;
        publish();
        try {
            for (const [index, slot] of [left, right].entries()) {
                const renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
                this.renderers.push(renderer);
                renderer.autoClear = false;
                renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
                renderer.outputColorSpace = T.SRGBColorSpace;
                renderer.toneMapping = T.ACESFilmicToneMapping;
                renderer.toneMappingExposure = 1;
                renderer.shadowMap.enabled = true;
                renderer.shadowMap.type = T.PCFShadowMap;
                renderer.domElement.setAttribute('aria-label', index === 0 ? '场景编辑 WebGL 视口' : '拍摄摄影机 WebGL 实时取景');
                renderer.domElement.tabIndex = index === 0 ? 0 : -1;
                renderer.domElement.setAttribute('role', 'img');
                slot.appendChild(renderer.domElement);
                const lost = (event) => { event.preventDefault(); if (this.disposed)
                    return; this.lost = true; this.invalidateIdentity(); this.cancelFrame(); this.onFatal('WebGL 上下文已丢失。请关闭摄影棚后重新打开；其他创作功能仍可使用。'); };
                renderer.domElement.addEventListener('webglcontextlost', lost);
                this.handlers.push({ canvas: renderer.domElement, lost });
            }
            this.shooting = new ShootingRenderer(this.renderers[1], this.scene, this.camera, status => this.onDofStatus?.(status));
            this.backdrop = new StageBackdrop(this.renderers, n => { lifecycle.workers += n; publish(); });
            this.scene.background = new T.Color(0x343c43);
            this.editor.position.set(10, 7, 13);
            this.editor.layers.enable(1);
            this.camera.rotation.order = 'YXZ';
            this.light.rotation.order = 'YXZ';
            this.scene.add(this.camera, this.light, this.light.target, this.ambient, this.subjectRoot, this.peopleRoot);
            this.light.castShadow = true;
            this.light.shadow.mapSize.set(1024, 1024);
            this.light.shadow.bias = -.0002;
            this.light.shadow.normalBias = .025;
            this.floor = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshStandardMaterial({ color: 0x979b9e, roughness: .95 }));
            this.floor.rotation.x = -Math.PI / 2;
            this.floor.receiveShadow = true;
            this.scene.add(this.floor);
            this.scene.add(layer(new T.GridHelper(12, 24, 0x879297, 0x58656d)), layer(new T.AxesHelper(3)));
            const icon = new T.Group();
            const body = new T.Mesh(new T.BoxGeometry(.32, .22, .21), new T.MeshBasicMaterial({ color: 0x64d6b7 }));
            const lens = new T.Mesh(new T.CylinderGeometry(.08, .12, .2, 12), new T.MeshBasicMaterial({ color: 0x64d6b7 }));
            lens.rotation.x = Math.PI / 2;
            lens.position.z = -.18;
            icon.add(body, lens);
            this.camera.add(layer(icon));
            const sun = new T.Group();
            sun.add(new T.Mesh(new T.SphereGeometry(.13, 16, 12), new T.MeshBasicMaterial({ color: 0xffd38a })));
            const rays = [];
            for (let i = 0; i < 8; i++) {
                const a = i * Math.PI / 4;
                rays.push(Math.cos(a) * .2, Math.sin(a) * .2, 0, Math.cos(a) * .3, Math.sin(a) * .3, 0);
            }
            ;
            sun.add(new T.LineSegments(new T.BufferGeometry().setAttribute('position', new T.Float32BufferAttribute(rays, 3)), new T.LineBasicMaterial({ color: 0xffd38a })));
            this.light.add(layer(sun));
            this.direction = new T.ArrowHelper(new T.Vector3(0, -1, 0), new T.Vector3(), 2, 0xffd38a, .22, .12);
            this.scene.add(layer(this.direction));
            this.frustum = new T.LineSegments(new T.BufferGeometry().setAttribute('position', new T.Float32BufferAttribute(new Float32Array(72), 3)), new T.LineBasicMaterial({ color: 0x64d6b7, transparent: true, opacity: .7 }));
            this.scene.add(layer(this.frustum));
            this.controls = new OrbitControls(this.editor, this.renderers[0].domElement);
            this.controls.target.set(0, 1, 0);
            this.controls.enableDamping = false;
            this.controls.minDistance = .5;
            this.controls.maxDistance = 100000;
            this.controls.addEventListener('change', this.invalidate);
            this.transform = new TransformControls(this.editor, this.renderers[0].domElement);
            this.helper = this.transform.getHelper();
            layer(this.helper);
            this.transform.getRaycaster().layers.set(1);
            this.scene.add(this.helper);
            this.transform.setSize(.85);
            this.transform.addEventListener('dragging-changed', this.dragHandler);
            this.transform.addEventListener('change', this.invalidate);
            this.transform.addEventListener('objectChange', this.objectChanged);
            this.renderers[0].domElement.addEventListener('pointerdown', this.pickJoint, true);
            this.renderers[0].domElement.addEventListener('pointercancel', this.cancelGesture);
            this.renderers[0].domElement.addEventListener('lostpointercapture', this.finishGesture);
            window.addEventListener('blur', this.finishGesture);
            window.addEventListener('keydown', this.gestureKey, true);
            this.observer = new ResizeObserver(this.invalidate);
            this.observer.observe(left);
            this.observer.observe(right);
            this.host.dataset.webgl = this.renderers[0].getContext().getParameter(this.renderers[0].getContext().VERSION);
            const gl = this.renderers[0].getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
            this.host.dataset.gpu = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
        }
        catch (error) {
            this.dispose();
            throw new Error(`WebGL 2 初始化失败：${error instanceof Error ? error.message : '此浏览器或设备不支持'}。请检查浏览器图形加速，其他创作功能不受影响。`);
        }
    }
    objectChanged = () => {
        if (this.editingLocked) {
            if (this.config)
                this.update(this.config, this.selected, this.mode);
            return;
        }
        this.configurationEpoch++;
        if (this.config?.version === 3 && this.selected === 'subject' && !this.poseEditing) {
            const person = this.personId && this.peopleRigs.get(this.personId);
            if (person)
                this.personMove?.(this.personId, tuple(person.root.position), [degrees(person.root.rotation.x), degrees(person.root.rotation.y), degrees(person.root.rotation.z)]);
            this.invalidate();
            return;
        }
        const selectedRig = this.config?.version === 3 ? (this.personId ? this.peopleRigs.get(this.personId)?.rig : undefined) : this.rig;
        if (this.poseEditing && this.selected === 'subject' && selectedRig) {
            const object = selectedRig.joints[this.joint], rotation = limitRotation(this.joint, [degrees(object.rotation.x), degrees(object.rotation.y), degrees(object.rotation.z)]);
            object.rotation.set(...rotation.map(radians), 'XYZ');
            const person = this.config.version === 3 ? this.config.people?.persons.find(p => p.id === this.personId) : undefined, pose = setJoint(person?.pose ?? poseOf(this.config), this.joint, rotation);
            if (person)
                person.pose = pose;
            else
                this.config.pose = pose;
            this.onPoseChange?.(pose);
        }
        else if (this.selected) {
            const object = this.selected === 'subject' ? (this.config.version === 3 ? (this.personId ? this.peopleRigs.get(this.personId)?.root : null) : this.subjectRoot) : this.selected === 'camera' ? this.camera : this.light;
            if (!object)
                return;
            this.onMove(this.selected, tuple(object.position), [degrees(object.rotation.x), degrees(object.rotation.y), degrees(object.rotation.z)]);
        }
        this.invalidate();
    };
    finishGesture = () => { if (this.disposed || !this.transform?.dragging)
        return; this.transform.pointerUp(null); this.transform.disconnect(); this.transform.connect(this.renderers[0].domElement); this.controls.enabled = true; this.invalidate(); };
    cancelGesture = () => { this.transform?.reset(); this.finishGesture(); };
    gestureKey = (event) => { if (event.key === 'Escape' && this.transform?.dragging && !(event.target instanceof HTMLInputElement)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.cancelGesture();
    } };
    pickJoint = (event) => {
        if (this.editingLocked)
            return;
        if (this.config?.version === 3 && event.button === 0 && !this.transform.axis) {
            const rect = this.left.getBoundingClientRect(), ray = new T.Raycaster();
            ray.setFromCamera(new T.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1), this.editor);
            const hit = ray.intersectObject(this.peopleRoot, true)[0];
            const id = hit && this.personForObject(hit.object);
            if (id && (!this.poseEditing || id !== this.personId)) {
                this.personSelect?.(id);
                return;
            }
        }
        const rig = this.config?.version === 3 ? (this.personId ? this.peopleRigs.get(this.personId)?.rig : undefined) : this.rig;
        if (!this.poseEditing || this.selected !== 'subject' || !rig || event.button !== 0 || this.transform.axis)
            return;
        const rect = this.left.getBoundingClientRect(), point = new T.Vector2(event.clientX - rect.left, event.clientY - rect.top);
        const nearest = jointIds.map(id => { const p = rig.joints[id].getWorldPosition(new T.Vector3()).project(this.editor); return { id, p, d: point.distanceTo(new T.Vector2((p.x + 1) * rect.width / 2, (1 - p.y) * rect.height / 2)) }; }).filter(v => v.p.z > -1 && v.p.z < 1 && v.d <= 13).sort((a, b) => a.d - b.d || a.p.z - b.p.z)[0];
        if (!nearest)
            return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (this.onJointSelect?.(nearest.id) === false)
            return;
        this.joint = nearest.id;
        this.attachControls();
        this.invalidate();
    };
    setPoseEditing(enabled, joint) { if (enabled && !this.poseEditing)
        this.focusSubject(); this.poseEditing = enabled; this.joint = joint; this.attachControls(); this.invalidate(); }
    setEditingLocked(value) { if (this.editingLocked === value)
        return; this.editingLocked = value; if (value) {
        this.finishGesture();
        if (this.config)
            this.update(this.config, this.selected, this.mode);
    } this.attachControls(); this.invalidate(); }
    attachControls() {
        if (!this.config || !this.transform)
            return;
        this.transform.enabled = !this.editingLocked;
        if (this.editingLocked) {
            this.transform.detach();
            return;
        }
        const rig = this.config.version === 3 ? (this.personId ? this.peopleRigs.get(this.personId)?.rig : undefined) : this.rig, poseActive = this.poseEditing && this.selected === 'subject' && !!rig;
        this.frustum.visible = !poseActive;
        this.direction.visible = !poseActive;
        this.camera.children.forEach(o => o.visible = !poseActive);
        this.light.children.forEach(o => o.visible = !poseActive);
        for (const candidate of [this.rig, ...[...this.peopleRigs.values()].map(p => p.rig)].filter(Boolean))
            for (const id of jointIds) {
                const marker = candidate.markers[id];
                marker.visible = poseActive && candidate === rig;
                marker.material.color.setHex(id === this.joint ? 0xffd55f : id.startsWith('right') ? 0xeebf7a : 0x76dfc4);
                marker.scale.setScalar(id === this.joint ? 1.35 : 1);
            }
        const object = poseActive ? rig.joints[this.joint] : this.selected === 'subject' ? (this.config.version === 3 ? (this.personId ? this.peopleRigs.get(this.personId)?.root : null) : this.subjectRoot) : this.selected === 'camera' ? this.camera : this.selected === 'light' ? this.light : null;
        if (!object) {
            this.transform.detach();
            return;
        }
        if (this.transform.object !== object) {
            this.finishGesture();
            this.transform.attach(object);
        }
        const locked = this.selected === 'camera' || this.selected === 'light' ? this.config[this.selected].aim === 'target' : false;
        const mode = poseActive ? 'rotate' : locked ? 'translate' : this.mode;
        this.transform.setMode(mode);
        this.transform.setSpace(poseActive || mode === 'rotate' ? 'local' : 'world');
        for (const axis of ['X', 'Y', 'Z'])
            this.transform[`show${axis}`] = !poseActive || !!jointDefinitions[this.joint].axes[axis];
        this.transform.showE = !poseActive;
        this.transform.showXYZE = !poseActive;
    }
    personForObject(object) { for (let n = object; n && n !== this.peopleRoot; n = n.parent)
        if (typeof n.userData.personId === 'string')
            return n.userData.personId; return null; }
    setPeopleInteraction(id, onMove, onSelect, report) { if (this.personId !== id)
        this.finishGesture(); this.personId = id; this.personMove = onMove; this.personSelect = onSelect; this.spatialReport = report; this.attachControls(); this.invalidate(); }
    contentRoot() { return this.config?.version === 3 ? this.peopleRoot : this.subjectRoot; }
    contentBounds() { const box = new T.Box3().setFromObject(this.contentRoot()); return box.isEmpty() ? new T.Box3().setFromCenterAndSize(new T.Vector3().fromArray(this.config.target), new T.Vector3(2, 2, 2)) : box; }
    updatePeople(config) {
        const people = config.version === 3 ? config.people?.persons ?? [] : [], ids = new Set(people.map(p => p.id));
        for (const [id, p] of this.peopleRigs)
            if (!ids.has(id)) {
                this.peopleRoot.remove(p.root);
                releaseObject(p.root);
                this.peopleRigs.delete(id);
            }
        for (const person of people) {
            let item = this.peopleRigs.get(person.id);
            if (!item) {
                const rig = createMannequin(), root = new T.Group(), wrapper = new T.Group();
                root.userData.personId = person.id;
                wrapper.add(rig.object);
                root.add(wrapper);
                this.peopleRoot.add(root);
                item = { root, wrapper, rig };
                this.peopleRigs.set(person.id, item);
            }
            item.root.position.fromArray(person.root.position);
            item.root.rotation.set(...person.root.rotation.map(radians), 'YXZ');
            item.root.scale.setScalar(1);
            applyPose(item.rig, person.pose);
            const bounds = item.rig.restBounds, size = bounds.getSize(new T.Vector3()), center = bounds.getCenter(new T.Vector3()), factor = (config.normalize ? 2 / Math.max(size.x, size.y, size.z) : 1) * config.scale;
            item.wrapper.scale.setScalar(factor);
            item.wrapper.position.set(-center.x * factor, -bounds.min.y * factor, -center.z * factor);
            item.rig.object.traverse(n => { if (n instanceof T.Mesh && n.material instanceof T.MeshStandardMaterial)
                n.material.color.set(person.color); });
            for (const joint of jointIds)
                item.rig.markers[joint].visible = false;
        }
        if (this.personId && !ids.has(this.personId))
            this.personId = null;
    }
    reportSpatial() {
        if (!this.spatialReport || this.config.version !== 3)
            return;
        this.scene.updateMatrixWorld(true);
        this.camera.updateMatrixWorld(true);
        const rect = this.renderers[1].domElement.getBoundingClientRect(), vp = this.renderers[1].getCurrentViewport(new T.Vector4()), buffer = this.renderers[1].domElement, stamp = JSON.stringify([this.config, rect.width, rect.height, vp.toArray(), this.editingLocked, this.selected]);
        if (stamp === this.lastSpatialReport)
            return;
        this.lastSpatialReport = stamp;
        const project = (v) => { const camera = v.clone().applyMatrix4(this.camera.matrixWorldInverse), ndc = v.clone().project(this.camera); return { world: v.toArray(), camera: camera.toArray(), depth: -camera.z, ndc: ndc.toArray(), pixel: [(vp.x + (ndc.x + 1) * vp.z / 2) * rect.width / buffer.width, (buffer.height - vp.y - (ndc.y + 1) * vp.w / 2) * rect.height / buffer.height] }; };
        const frustum = new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse)), people = [];
        for (const person of this.config.people.persons) {
            const item = this.peopleRigs.get(person.id);
            const box = new T.Box3().setFromObject(item.root), surfaces = [];
            item.rig.object.traverse(object => { if (!(object instanceof T.Mesh) || !object.layers.test(this.camera.layers))
                return; const geometry = object.geometry, position = geometry.getAttribute('position'), index = geometry.index; if (!position || !index)
                return; const tri = Math.floor(index.count / 3 / 2) * 3; const point = new T.Vector3(); for (let i = 0; i < 3; i++)
                point.add(new T.Vector3().fromBufferAttribute(position, index.getX(tri + i))); point.multiplyScalar(1 / 3).applyMatrix4(object.matrixWorld); const projected = project(point), ray = new T.Raycaster(this.camera.position, point.clone().sub(this.camera.position).normalize()), hit = ray.intersectObject(this.peopleRoot, true)[0]; surfaces.push({ ...projected, frontPersonId: hit ? this.personForObject(hit.object) : null, frontDistance: hit?.distance ?? null, visible: !!hit && this.personForObject(hit.object) === person.id && projected.ndc.every((n) => n >= -1 && n <= 1) }); });
            people.push({ id: person.id, source: person.source, materialRef: person.materialRef, worldMatrix: item.root.matrixWorld.toArray(), actualRoot: { position: item.root.position.toArray(), rotation: [degrees(item.root.rotation.x), degrees(item.root.rotation.y), degrees(item.root.rotation.z)] }, rootProjection: project(item.root.getWorldPosition(new T.Vector3())), headProjection: project(item.rig.joints.head.getWorldPosition(new T.Vector3())), bounds: { min: box.min.toArray(), max: box.max.toArray() }, intersectsFrustum: frustum.intersectsBox(box), surfaceSamples: surfaces, visibleSurfaceSamples: surfaces.filter(x => x.visible).length, visibility: !frustum.intersectsBox(box) ? 'out-of-frustum' : surfaces.some(x => x.visible) ? 'visible-at-sampled-surfaces' : 'occluded-at-sampled-surfaces' });
        }
        this.spatialReport({ format: 'studio-spatial-actual-render/1', sceneId: this.config.people.sceneId, scene: structuredClone(this.config), renders: this.renders, interaction: { editingLocked: this.editingLocked, gizmoEnabled: this.transform.enabled, gizmoAttached: !!this.transform.object, selected: this.selected }, measurement: { lastRenderCpuMs: this.lastRenderMs, lastUpdateCpuMs: this.lastUpdateMs, renderers: this.renderers.map(r => ({ calls: r.info.render.calls, triangles: r.info.render.triangles, geometries: r.info.memory.geometries, textures: r.info.memory.textures })) }, viewport: { rect: { width: rect.width, height: rect.height }, buffer: [buffer.width, buffer.height], actual: vp.toArray() }, camera: { world: this.camera.matrixWorld.toArray(), view: this.camera.matrixWorldInverse.toArray(), projection: this.camera.projectionMatrix.toArray(), position: this.camera.position.toArray(), rotation: this.orientation('camera'), near: this.camera.near, far: this.camera.far }, people, occlusionMethod: 'actual mesh triangle-centroid surface rays against all current people; bounded sampled visibility, not center-only/full coverage claim' });
    }
    mode = 'translate';
    orientation(which) { const o = which === 'camera' ? this.camera : this.light; return [degrees(o.rotation.x), degrees(o.rotation.y), degrees(o.rotation.z)]; }
    preset(position) { const c = new T.PerspectiveCamera(); c.rotation.order = 'YXZ'; c.position.fromArray(position); c.lookAt(new T.Vector3().fromArray(this.config.target)); return [degrees(c.rotation.x), degrees(c.rotation.y), degrees(c.rotation.z)]; }
    update(config, selected, mode) {
        const started = this.spatialReport ? performance.now() : 0;
        if (this.disposed)
            return;
        if (!this.config || referenceSignature(this.config) !== referenceSignature(config))
            this.configurationEpoch++;
        this.config = structuredClone(config);
        this.selected = selected;
        this.mode = mode;
        this.camera.position.fromArray(config.camera.position);
        this.camera.aspect = Number(config.ratio.split(':')[0]) / Number(config.ratio.split(':')[1]);
        this.camera.near = .01;
        this.camera.far = Math.max(100, new T.Vector3().fromArray(config.target).distanceTo(this.camera.position) * 8);
        this.camera.zoom = 1;
        const focal = focalLengthOf(config.camera);
        if (validFocalLength(focal))
            this.camera.fov = verticalFov(focal);
        this.camera.updateProjectionMatrix();
        if (config.camera.aim === 'target')
            this.camera.lookAt(new T.Vector3().fromArray(config.target));
        else
            this.camera.rotation.set(...config.camera.rotation.map(radians), 'YXZ');
        this.light.position.fromArray(config.light.position);
        this.light.intensity = config.light.power;
        if (config.light.aim === 'target') {
            this.light.lookAt(new T.Vector3().fromArray(config.target));
            this.light.target.position.fromArray(config.target);
        }
        else {
            this.light.rotation.set(...config.light.rotation.map(radians), 'YXZ');
            this.light.target.position.copy(this.light.position).add(new T.Vector3(0, 0, -1).applyEuler(this.light.rotation));
        }
        this.floor.visible = config.backdrop.ground;
        this.ambient.intensity = config.ambient;
        this.light.shadow.camera.far = Math.max(40, this.light.position.distanceTo(this.light.target.position) * 5);
        this.light.shadow.camera.updateProjectionMatrix();
        this.updatePeople(config);
        if (this.rig)
            applyPose(this.rig, poseOf(config));
        const root = rootOf(config);
        this.subjectRoot.position.fromArray(root.position);
        this.subjectRoot.rotation.set(...root.rotation.map(radians), 'YXZ');
        this.attachControls();
        this.placeSubject();
        this.updateFrustum();
        if (started)
            this.lastUpdateMs = performance.now() - started;
        this.invalidate();
    }
    placeSubject() { if (!this.subject || !this.raw || !this.config)
        return; const box = this.rawBounds, size = box.getSize(new T.Vector3()), center = box.getCenter(new T.Vector3()), factor = (this.config.normalize ? 2 / Math.max(size.x, size.y, size.z) : 1) * this.config.scale; this.subject.scale.setScalar(factor); this.subject.position.set(-center.x * factor, -box.min.y * factor, -center.z * factor); const extent = Math.max(size.x, size.y, size.z) * factor; this.floor.scale.setScalar(Math.max(20, extent * 15)); }
    updateFrustum() { this.camera.updateMatrixWorld(); const near = .2, far = Math.min(4, this.camera.position.distanceTo(new T.Vector3().fromArray(this.config.target))), points = []; for (const z of [near, far])
        for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]])
            points.push(new T.Vector3(x * z * Math.tan(radians(this.camera.getEffectiveFOV() / 2)) * this.camera.aspect, y * z * Math.tan(radians(this.camera.getEffectiveFOV() / 2)), -z).applyMatrix4(this.camera.matrixWorld)); const a = []; for (const [i, j] of [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]])
        a.push(...points[i].toArray(), ...points[j].toArray()); const attribute = this.frustum.geometry.getAttribute('position'); attribute.array.set(a); attribute.needsUpdate = true; this.frustum.geometry.computeBoundingSphere(); this.scene.updateMatrixWorld(true); const delta = this.light.target.position.clone().sub(this.light.position); this.direction.position.copy(this.light.position); this.direction.setDirection(delta.normalize()); this.direction.setLength(Math.min(3, this.light.position.distanceTo(this.light.target.position)), .22, .12); }
    cancelLoading() { this.gate.cancel(); this.loadAbort?.abort(); this.modelEpoch++; this.modelPending = false; this.busy(false); }
    async loadBackdrop(file, kind) { const accepted = await this.backdrop.load(file, kind); if (accepted)
        this.invalidate(); return accepted; }
    setBusy(fn) { this.busy = fn; }
    async load(file, kind, expectedContentId, authorize = () => true) {
        if (file && !/^m-[a-f0-9]{64}$/.test(expectedContentId || '') || !file && !['box', 'cylinder', 'person'].includes(kind || ''))
            throw Error('MODEL_BINDING_REQUIRED');
        const token = this.gate.next();
        this.loadAbort?.abort();
        this.loadAbort = new AbortController();
        const signal = this.loadAbort.signal;
        this.modelEpoch++;
        this.modelPending = true;
        this.busy(true);
        try {
            const rig = !file && kind === 'person' ? createMannequin() : undefined;
            const result = file ? await readGLB(file, signal) : { object: rig?.object || builtin(kind), info: undefined, contentId: null };
            if (this.disposed || signal.aborted || !this.gate.current(token) || !authorize()) {
                releaseObject(result.object);
                return { accepted: false, contentId: null };
            }
            if (file && result.contentId !== expectedContentId) {
                releaseObject(result.object);
                throw Error('MODEL_CONTENT_HASH_MISMATCH');
            }
            const old = { subject: this.subject, raw: this.raw, rig: this.rig, bounds: this.rawBounds.clone(), id: this.modelContentId, builtin: this.modelBuiltin };
            const next = new T.Group();
            next.add(result.object);
            try {
                this.transform.detach();
                if (old.subject)
                    this.subjectRoot.remove(old.subject);
                this.rig = rig;
                this.raw = result.object;
                this.rawBounds.copy(rig ? rig.restBounds : new T.Box3().setFromObject(result.object));
                this.subject = next;
                this.subjectRoot.add(next);
                if (rig)
                    applyPose(rig, poseOf(this.config));
                this.placeSubject();
                this.attachControls();
                this.modelContentId = result.contentId;
                this.modelBuiltin = file ? null : kind;
                this.host.dataset.loadedContentId = this.modelContentId || '';
                this.host.dataset.loadedBuiltin = this.modelBuiltin || '';
            }
            catch (error) {
                this.subjectRoot.remove(next);
                releaseObject(next);
                this.subject = old.subject;
                this.raw = old.raw;
                this.rig = old.rig;
                this.rawBounds.copy(old.bounds);
                this.modelContentId = old.id;
                this.modelBuiltin = old.builtin;
                if (old.subject)
                    this.subjectRoot.add(old.subject);
                this.attachControls();
                throw error;
            }
            if (old.subject)
                releaseObject(old.subject);
            this.invalidate();
            return { accepted: true, info: result.info, contentId: this.modelContentId };
        }
        finally {
            if (this.gate.current(token) && !this.disposed) {
                this.modelPending = false;
                this.busy(false);
                this.invalidate();
            }
        }
    }
    fit() { if (!this.subject)
        throw new Error('主体尚未就绪。'); this.scene.updateMatrixWorld(true); const box = this.contentBounds(), sphere = box.getBoundingSphere(new T.Sphere()), target = tuple(box.getCenter(new T.Vector3())), half = Math.min(radians(this.camera.getEffectiveFOV() / 2), Math.atan(Math.tan(radians(this.camera.getEffectiveFOV() / 2)) * this.camera.aspect)), radius = Math.max(2, sphere.radius / Math.sin(half) * 1.2); return { target, position: [target[0] + radius * .6, target[1] + radius * .25, target[2] + radius * .76] }; }
    focusSubject() { if (!this.subject)
        return; this.scene.updateMatrixWorld(true); const sphere = this.contentBounds().getBoundingSphere(new T.Sphere()), aspect = Math.max(.2, this.left.clientWidth / Math.max(1, this.left.clientHeight)), half = Math.min(radians(22.5), Math.atan(Math.tan(radians(22.5)) * aspect)), r = Math.max(2, sphere.radius / Math.sin(half) * 1.22); this.editor.position.copy(sphere.center).add(new T.Vector3(.2, .10, 1).normalize().multiplyScalar(r)); this.controls.target.copy(sphere.center); this.controls.update(); this.invalidate(); }
    resetEditor() { const bounds = this.subject ? this.contentBounds() : new T.Box3().setFromCenterAndSize(new T.Vector3().fromArray(this.config.target), new T.Vector3(2, 2, 2)); bounds.expandByPoint(this.camera.position).expandByPoint(this.light.position).expandByPoint(new T.Vector3()); const sphere = bounds.getBoundingSphere(new T.Sphere()), aspect = Math.max(.2, this.left.clientWidth / Math.max(1, this.left.clientHeight)), half = Math.min(radians(22.5), Math.atan(Math.tan(radians(22.5)) * aspect)), r = Math.max(10, sphere.radius / Math.sin(half) * 1.4); this.editor.position.copy(sphere.center).add(new T.Vector3(.65, .45, .85).normalize().multiplyScalar(r)); this.controls.target.copy(sphere.center); this.controls.update(); this.invalidate(); }
    /** Read actual camera-space geometry and effective shooting status for a scene snapshot only. */
    describePrompt(snapshot) {
        this.assertModel(snapshot);
        if (this.disposed || this.lost || !this.subject || referenceSignature(snapshot) !== referenceSignature(this.config))
            throw new Error('场景未就绪或来源已变化，请等待有效场景。');
        this.render();
        if (this.lost)
            throw new Error('拍摄渲染不可用，不能确认当前景深状态。');
        this.scene.updateMatrixWorld(true);
        const box = new T.Box3();
        this.contentRoot().traverseVisible(object => { if (!(object instanceof T.Mesh) || !object.layers.test(this.camera.layers))
            return; const materials = Array.isArray(object.material) ? object.material : [object.material]; if (!materials.some(m => m.visible && m.opacity > 0))
            return; if (object instanceof T.SkinnedMesh) {
            object.computeBoundingBox();
            if (object.boundingBox)
                box.union(object.boundingBox.clone().applyMatrix4(object.matrixWorld));
        }
        else {
            if (!object.geometry.boundingBox)
                object.geometry.computeBoundingBox();
            if (object.geometry.boundingBox)
                box.union(object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld));
        } });
        const status = this.shooting?.diagnostics();
        return { ...promptGeometry(box, this.camera, this.light), effect: { state: status?.state === 'active' || status?.state === 'off' || status?.state === 'fallback' ? status.state : 'unknown', reason: status?.reason || '' } };
    }
    /** Capture synchronously before yielding; canvas.toBlob snapshots its bitmap at invocation.
     * Restore and redraw before the browser paints. No helper visibility, camera or editor state is changed.
     * The caller holds a modal edit lock until encoding settles; no preserveDrawingBuffer is enabled.
     */
    exporting = false;
    async captureReference(snapshot, longEdge, signal) {
        const contentStamp = this.contentStamp(snapshot);
        if (this.exporting)
            throw new Error('已有参考图正在输出，请等待。');
        if (this.disposed || this.lost || !this.subject || !this.shooting || referenceSignature(snapshot) !== referenceSignature(this.config))
            throw new Error('场景尚未就绪或快照已变化，请等待加载完成后重试。');
        if (signal.aborted)
            throw new Error('已取消输出；草稿和上次结果保留。');
        const { width, height } = referenceSize(snapshot.ratio, longEdge), r = this.renderers[1], gl = r.getContext(), canvas = r.domElement, size = r.getSize(new T.Vector2()), pixelRatio = r.getPixelRatio(), viewport = r.getViewport(new T.Vector4()), scissor = r.getScissor(new T.Vector4()), scissorTest = r.getScissorTest(), clear = r.getClearColor(new T.Color()), alpha = r.getClearAlpha(), limits = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
        if (width > Math.min(r.capabilities.maxTextureSize, gl.getParameter(gl.MAX_RENDERBUFFER_SIZE), limits[0]) || height > Math.min(r.capabilities.maxTextureSize, gl.getParameter(gl.MAX_RENDERBUFFER_SIZE), limits[1]))
            throw new Error('设备GPU尺寸限制不足以输出此尺寸，请选择1024。');
        this.exporting = true;
        this.finishGesture();
        this.cancelFrame();
        let pending, effect;
        try {
            r.setPixelRatio(1);
            r.setSize(width, height, false);
            r.setRenderTarget(null);
            r.setScissorTest(false);
            r.setViewport(0, 0, width, height);
            r.setClearColor(0x20262b);
            r.clear();
            this.scene.updateMatrixWorld(true);
            this.shooting.render(dofOf(snapshot.camera), { x: 0, y: 0, width, height }, () => this.backdrop?.bind(this.scene, snapshot.backdrop, 1, this.camera.aspect));
            if (gl.isContextLost())
                throw new Error('WebGL上下文丢失，未产生新图片；请重新打开工作台。');
            const gpuError = gl.getError();
            if (gpuError !== gl.NO_ERROR)
                throw new Error(`GPU渲染／读回准备失败（${gpuError}），未替换上次结果；请重试或选择1024。`);
            effect = this.shooting.diagnostics();
            pending = new Promise((resolve, reject) => { let settled = false; const finish = (error, blob) => { if (settled)
                return; settled = true; clearTimeout(timer); signal.removeEventListener('abort', abort); canvas.removeEventListener('webglcontextlost', lost); error ? reject(error) : resolve(blob); }; const abort = () => finish(new Error('已取消输出；草稿和上次结果保留。')), lost = () => finish(new Error('输出期间WebGL上下文丢失，请重新打开工作台。')), timer = window.setTimeout(() => finish(new Error('PNG编码超时，请重试或选择1024。')), 30000); signal.addEventListener('abort', abort, { once: true }); canvas.addEventListener('webglcontextlost', lost, { once: true }); try {
                canvas.toBlob(blob => { if (gl.isContextLost())
                    lost();
                else if (!blob || blob.type !== 'image/png' || !blob.size)
                    finish(new Error('PNG编码／读回失败，未替换上次结果。'));
                else
                    finish(null, blob); }, 'image/png');
            }
            catch (error) {
                finish(new Error(`图片无法读取或编码；本地贴图须允许浏览器读取。${error instanceof Error ? error.message : ''}`));
            } });
        }
        catch (error) {
            this.exporting = false;
            throw error;
        }
        finally {
            r.setPixelRatio(pixelRatio);
            r.setSize(size.x, size.y, false);
            r.setRenderTarget(null);
            r.setViewport(viewport);
            r.setScissor(scissor);
            r.setScissorTest(scissorTest);
            r.setClearColor(clear, alpha);
            // Restore the native preview targets immediately, including on synchronous serialization failure.
            if (!this.disposed && !this.lost)
                this.render();
        }
        try {
            const blob = await pending;
            if (signal.aborted || this.disposed || this.lost)
                throw new Error('输出已取消或工作台已关闭。');
            let decoded;
            try {
                decoded = await createImageBitmap(blob);
            }
            catch {
                throw new Error('PNG解码校验失败，未替换上次结果，请重试。');
            }
            try {
                if (decoded.width !== width || decoded.height !== height)
                    throw new Error('PNG实际尺寸不符，未替换上次结果。');
            }
            finally {
                decoded.close();
            }
            this.assertContentStamp(contentStamp, snapshot);
            return { blob, width, height, effect: effect };
        }
        finally {
            this.exporting = false;
        }
    }
    retryDof() { this.shooting?.reset(); this.invalidate(); }
    focusAt(clientX, clientY) {
        const renderer = this.renderers[1], canvas = renderer.domElement, rect = canvas.getBoundingClientRect(), x = clientX - rect.left, y = clientY - rect.top, ndc = shootingViewportPoint(x, y, rect.width, rect.height, canvas.width, canvas.height, renderer.getCurrentViewport(new T.Vector4()).toArray());
        if (!ndc)
            return { ok: false, message: '点击位于画幅留边，原焦点保持；请点实际拍摄画面。' };
        this.scene.updateMatrixWorld(true);
        this.camera.updateMatrixWorld(true);
        const ray = new T.Raycaster();
        ray.layers.mask = this.camera.layers.mask;
        ray.setFromCamera(new T.Vector2(ndc.x, ndc.y), this.camera);
        const hit = ray.intersectObject(this.contentRoot(), true).find(h => h.object instanceof T.Mesh);
        if (!hit)
            return { ok: false, message: '没有命中人物／产品几何表面，原焦点保持；背景图及HDR不能按其中物体对焦。' };
        const mesh = hit.object, material = Array.isArray(mesh.material) ? mesh.material[hit.face?.materialIndex || 0] : mesh.material;
        if (!material || !material.visible || material.transparent || !material.depthWrite || material.alphaTest > 0 || ('transmission' in material && Number(material.transmission) > 0))
            return { ok: false, message: '命中透明或镂空材质，无法保证有效表面深度；原焦点保持，请使用手动距离或不透明表面。' };
        const distance = -hit.point.clone().applyMatrix4(this.camera.matrixWorldInverse).z;
        if (!Number.isFinite(distance) || distance < dofLimits.focusMin || distance > dofLimits.focusMax || distance < this.camera.near || distance > this.camera.far)
            return { ok: false, message: '命中点不在有效对焦／拍摄深度范围，原焦点保持。' };
        this.lastFocusPick = { distance, rayDistance: hit.distance, point: tuple(hit.point), ndc };
        return { ok: true, distance, x: x / rect.width, y: y / rect.height, point: tuple(hit.point) };
    }
    cancelFrame() { if (this.frame) {
        cancelAnimationFrame(this.frame);
        this.frame = 0;
        lifecycle.pendingFrames--;
        publish();
    } }
    invalidate = () => { if (this.disposed || this.lost || this.frame)
        return; this.frame = requestAnimationFrame(() => { this.frame = 0; lifecycle.pendingFrames--; publish(); this.render(); }); lifecycle.pendingFrames++; publish(); };
    render() { const started = this.spatialReport ? performance.now() : 0; if (this.disposed || this.lost || !this.config)
        return; this.subjectRoot.visible = this.config.version !== 3 && this.identityMatches(this.config); this.peopleRoot.visible = this.config.version === 3 && this.identityMatches(this.config); try {
        for (const [index, slot] of [this.left, this.right].entries()) {
            const r = this.renderers[index], w = Math.max(1, slot.clientWidth), h = Math.max(1, slot.clientHeight);
            if (r.domElement.width !== Math.floor(w * r.getPixelRatio()) || r.domElement.height !== Math.floor(h * r.getPixelRatio()))
                r.setSize(w, h, false);
            r.setScissorTest(false);
            r.setViewport(0, 0, w, h);
            r.setClearColor(0x20262b);
            r.clear();
            if (index === 0) {
                this.editor.aspect = w / h;
                this.editor.updateProjectionMatrix();
                this.backdrop?.bind(this.scene, this.config.backdrop, index, this.editor.aspect);
                r.render(this.scene, this.editor);
            }
            else {
                this.shooting.render(dofOf(this.config.camera), shootingFrame(w, h, this.camera.aspect), () => this.backdrop?.bind(this.scene, this.config.backdrop, index, this.camera.aspect));
            }
        }
        ;
        this.renders++;
        if (started)
            this.lastRenderMs = performance.now() - started;
        this.updateDiagnostics();
        this.reportSpatial();
    }
    catch (error) {
        this.lost = true;
        this.invalidateIdentity();
        this.onFatal(`3D 渲染中止：${error instanceof Error ? error.message : '未知错误'}。关闭后可重新尝试。`);
    } }
    updateDiagnostics() { if (this.disposed || !this.config)
        return; const handles = []; this.helper?.traverseVisible(n => { if (n instanceof T.Mesh && ['X', 'Y', 'Z'].includes(n.name)) {
        n.geometry.computeBoundingBox();
        const p = n.geometry.boundingBox?.getCenter(new T.Vector3()).applyMatrix4(n.matrixWorld).project(this.editor);
        if (p && Math.abs(p.x) < 1 && Math.abs(p.y) < 1)
            handles.push({ axis: n.name, x: (p.x + 1) * this.left.clientWidth / 2, y: (1 - p.y) * this.left.clientHeight / 2 });
        if (this.transform.mode === 'rotate') {
            const attr = n.geometry.getAttribute('position');
            for (let i = 0; i < attr.count; i += Math.max(1, Math.floor(attr.count / 18))) {
                const v = new T.Vector3().fromBufferAttribute(attr, i).applyMatrix4(n.matrixWorld).project(this.editor);
                if (Math.abs(v.x) < 1 && Math.abs(v.y) < 1)
                    handles.push({ axis: n.name, x: (v.x + 1) * this.left.clientWidth / 2, y: (1 - v.y) * this.left.clientHeight / 2 });
            }
        }
    } }); this.host.dataset.metrics = JSON.stringify({ loadedContentId: this.modelContentId, loadedBuiltin: this.modelBuiltin, modelEpoch: this.modelEpoch, configurationEpoch: this.configurationEpoch, modelPending: this.modelPending, modelMatches: this.identityMatches(this.config), renders: this.renders, shooting: this.shooting?.diagnostics(), focusPick: this.lastFocusPick, pending: !!this.frame, dragging: this.transform?.dragging || false, orbitEnabled: this.controls?.enabled, helpersLayer: 1, gizmoAxis: this.transform?.axis, selected: this.selected, transformMode: this.transform?.mode, editorPosition: this.editor.position.toArray(), shootingLayerMask: this.camera.layers.mask, editorLayerMask: this.editor.layers.mask, lightType: this.light.type, decay: this.light.decay, fov: this.camera.fov, zoom: this.camera.zoom, effectiveFov: this.camera.getEffectiveFOV(), focalLengthMm: focalLengthOf(this.config.camera), sensorHeightMm, sensorWidthMm: sensorHeightMm * this.camera.aspect, projectionMatrix: this.camera.projectionMatrix.toArray(), shootingActualViewport: this.renderers[1].getCurrentViewport(new T.Vector4()).toArray(), shootingBuffer: [this.renderers[1].domElement.width, this.renderers[1].domElement.height], shootingViewport: this.renderers[1].getViewport(new T.Vector4()).toArray(), frustumPoints: Array.from(this.frustum.geometry.getAttribute('position').array), editorFov: this.editor.fov, editorZoom: this.editor.zoom, aspect: this.camera.aspect, actualCameraPosition: this.camera.position.toArray(), actualCameraRotation: this.orientation('camera'), actualLightPosition: this.light.position.toArray(), lightPower: this.light.intensity, ambient: this.ambient.intensity, config: this.config, actualRoot: { position: tuple(this.subjectRoot.position), rotation: [degrees(this.subjectRoot.rotation.x), degrees(this.subjectRoot.rotation.y), degrees(this.subjectRoot.rotation.z)] }, poseEditing: this.poseEditing && !!this.rig, selectedJoint: this.rig ? this.joint : null, joints: this.rig ? Object.fromEntries(jointIds.map(id => { const world = this.rig.joints[id].getWorldPosition(new T.Vector3()), p = world.clone().project(this.editor); return [id, { world: world.toArray(), shootPosition: world.clone().project(this.camera).toArray(), localRotation: this.rig.joints[id].rotation.toArray().slice(0, 3).map(n => degrees(n)), x: (p.x + 1) * this.left.clientWidth / 2, y: (1 - p.y) * this.left.clientHeight / 2, editorMarker: this.rig.markers[id].visible, previewMarker: this.rig.markers[id].visible && this.rig.markers[id].layers.test(this.camera.layers) }]; })) : null, handles, backdrop: this.backdrop?.diagnostics(), groundVisible: this.floor.visible, memory: this.renderers.map(r => ({ ...r.info.memory })), subjectBox: this.subject ? this.contentBounds().getSize(new T.Vector3()).toArray() : null }); }
    dispose() { if (this.disposed)
        return; this.disposed = true; this.invalidateIdentity(); this.modelPending = false; this.gate.cancel(); this.loadAbort?.abort(); this.cancelFrame(); this.observer?.disconnect(); const canvas = this.renderers[0]?.domElement; canvas?.removeEventListener('pointerdown', this.pickJoint, true); canvas?.removeEventListener('pointercancel', this.cancelGesture); canvas?.removeEventListener('lostpointercapture', this.finishGesture); window.removeEventListener('blur', this.finishGesture); window.removeEventListener('keydown', this.gestureKey, true); this.controls?.removeEventListener('change', this.invalidate); this.controls?.dispose(); if (this.transform) {
        this.transform.removeEventListener('change', this.invalidate);
        this.transform.removeEventListener('objectChange', this.objectChanged);
        this.transform.removeEventListener('dragging-changed', this.dragHandler);
        this.transform.detach();
        this.scene.remove(this.helper);
        this.transform.dispose();
    } ; this.handlers.forEach(({ canvas, lost }) => canvas.removeEventListener('webglcontextlost', lost)); this.scene.background = null; this.scene.environment = null; this.shooting?.dispose(); this.backdrop?.dispose(); this.light.shadow.dispose(); releaseObject(this.scene); this.scene.clear(); lifecycle.lastReleased = []; this.renderers.forEach(r => { r.renderLists.dispose(); r.dispose(); r.forceContextLoss(); r.domElement.remove(); lifecycle.lastReleased.push({ ...r.info.memory, contextLost: r.getContext().isContextLost() }); }); lifecycle.active--; lifecycle.disposed++; publish(); }
}
