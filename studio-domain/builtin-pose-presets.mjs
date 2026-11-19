import * as T from 'three';
import { createMannequin, applyPose } from './mannequin.mjs';
import { defaultPose, isPerson, jointIds, poseOf, rootOf, setJoint } from './pose-state.mjs';
export const builtinPoseIds = ['standing', 't', 'walking', 'running', 'sitting', 'squat', 'one-knee', 'both-knees', 'wide-stance', 'leaning', 'bow', 'thinking', 'fighting', 'kick', 'throw', 'push', 'wave', 'reach', 'folded-arms', 'phone'];
const d = (id, name, angles, description, note = '', status = 'implemented') => ({ id, name, angles, description, note, status });
/** Original authored static joint configurations for our existing rigid mannequin, degrees, local XYZ. */
export const builtinPosePresets = [
    d('standing', '站立', {}, '人物站立，双腿伸直，双臂自然下垂。'),
    d('t', 'T 型', { leftShoulder: [0, 0, 90], rightShoulder: [0, 0, -90] }, '人物呈T字站姿，双腿伸直，双臂向两侧伸展。'),
    d('walking', '行走', { torso: [6, 0, 0], leftHip: [-32, 0, 0], rightHip: [24, 0, 0], leftKnee: [18, 0, 0], rightKnee: [12, 0, 0], leftShoulder: [30, 0, 0], rightShoulder: [-35, 0, 0], leftElbow: [-25, 0, 0], rightElbow: [-35, 0, 0] }, '人物双腿前后错开、双臂交错摆动，呈行走动作的静态定格。', '动作定格，不是动画；仅最低支撑点接地。'),
    d('running', '跑步', { torso: [12, 0, 0], leftHip: [-60, 0, 0], rightHip: [30, 0, 0], leftKnee: [65, 0, 0], rightKnee: [105, 0, 0], leftShoulder: [50, 0, 10], rightShoulder: [-70, 0, -10], leftElbow: [-90, 0, 0], rightElbow: [-90, 0, 0] }, '人物身体前倾，双腿与双臂大幅前后错开，呈跑步动作的静态定格。', '静态定格，无步态与重心模拟。'),
    d('sitting', '坐姿', { leftHip: [-90, 0, 0], rightHip: [-90, 0, 0], leftKnee: [90, 0, 0], rightKnee: [90, 0, 0], leftShoulder: [-12, 0, 0], rightShoulder: [-12, 0, 0], leftElbow: [-70, 0, 0], rightElbow: [-70, 0, 0] }, '人物髋部和双膝弯曲，大腿前伸、小腿向下，呈静态坐姿。', '仅姿态，未添加椅子；可另行搭配座具。'),
    d('squat', '蹲下', { torso: [20, 0, 0], leftHip: [-100, 0, 7], rightHip: [-100, 0, -7], leftKnee: [135, 0, 0], rightKnee: [135, 0, 0], leftAnkle: [-35, 0, 0], rightAnkle: [-35, 0, 0], leftShoulder: [-35, 0, 10], rightShoulder: [-35, 0, -10], leftElbow: [-75, 0, 0], rightElbow: [-75, 0, 0] }, '人物髋膝深度弯曲，身体降低，双臂位于身前，呈静态蹲姿。', '刚性腿段，无锁脚或平衡求解。'),
    d('one-knee', '单膝跪', { leftHip: [-94.36, 0, 0], leftKnee: [94.36, 0, 0], rightKnee: [97.5, 0, 0], rightAnkle: [45, 0, 0], leftShoulder: [-10, 0, 0], leftElbow: [-25, 0, 0], rightElbow: [-15, 0, 0] }, '人物一条腿向前自然屈膝、前脚掌平放，后膝接地，小腿向后接近地面，呈直身单膝跪的静态姿态。', '后小腿离水平7.5°，后脚尖接近地面、脚跟抬起；现有踝范围不支持脚背平贴。', 'limited'),
    d('both-knees', '双膝跪', { leftKnee: [97.5, 0, 0], rightKnee: [97.5, 0, 0], leftAnkle: [45, 0, 0], rightAnkle: [45, 0, 0], leftShoulder: [-8, 0, 0], rightShoulder: [-8, 0, 0], leftElbow: [-15, 0, 0], rightElbow: [-15, 0, 0] }, '人物直身双膝接地，小腿自然向后并接近地面，呈双膝跪的静态姿态。', '小腿离水平7.5°，后脚尖接近地面、脚跟抬起；不宣称脚背平贴或臀部坐到脚跟。', 'limited'),
    d('wide-stance', '叉腿', { leftHip: [0, 0, 25], rightHip: [0, 0, -25], leftKnee: [8, 0, 0], rightKnee: [8, 0, 0], leftAnkle: [-8, 0, -15], rightAnkle: [-8, 0, 15], leftShoulder: [0, 0, 12], rightShoulder: [0, 0, -12] }, '人物双腿向左右分开，呈静态分腿站姿。', '此处“叉腿”指分腿站立，不是盘腿坐。'),
    d('leaning', '倚靠', { torso: [0, 0, -18], neck: [0, 0, 10], leftHip: [0, 0, -10], rightHip: [0, 0, 15], leftKnee: [20, 0, 0], leftShoulder: [0, 0, 20], rightShoulder: [0, 0, -10], rightElbow: [-25, 0, 0] }, '人物躯干向侧方倾斜，双腿不对称，呈侧倚的静态姿态。', '仅侧倚姿态，未添加墙或支撑物，不模拟接触。', 'limited'),
    d('bow', '鞠躬', { torso: [35, 0, 0], neck: [20, 0, 0], head: [10, 0, 0], leftShoulder: [-10, 0, 0], rightShoulder: [-10, 0, 0] }, '人物上身前倾、头颈低垂，呈静态鞠躬姿态。', '躯干前倾上限35°，不宣称90°深鞠躬。'),
    d('thinking', '思考', { neck: [8, -8, 0], rightShoulder: [-30, 0, 10], rightElbow: [-130, 0, 0], rightWrist: [-25, 0, 0], leftShoulder: [-35, -35, -10], leftElbow: [-90, 0, 0] }, '人物一侧前臂抬向下颌附近，另一侧手臂弯曲，呈静态思考姿态。', '没有手指关节，手与下颌为近似位置关系。', 'limited'),
    d('fighting', '格斗', { torso: [8, -15, 0], leftHip: [-20, 0, 12], rightHip: [10, 0, -12], leftKnee: [20, 0, 0], rightKnee: [20, 0, 0], leftShoulder: [-60, 0, 12], rightShoulder: [-40, 0, -12], leftElbow: [-100, 0, 0], rightElbow: [-110, 0, 0] }, '人物双臂屈肘抬至身前，双腿错开，呈格斗防守的静态姿态。', '手为既有整体块，无握拳手指。', 'limited'),
    d('kick', '踢球', { leftHip: [-75, 0, 0], leftKnee: [8, 0, 0], rightKnee: [10, 0, 0], rightAnkle: [-10, 0, 0], leftShoulder: [0, 0, 40], rightShoulder: [0, 0, -45], torso: [0, -8, 0] }, '人物一腿抬起向前伸出，双臂展开平衡，呈踢腿动作的静态定格。', '未添加球；不模拟踢球接触或运动。'),
    d('throw', '投掷', { torso: [0, -20, 0], rightShoulder: [-95, -35, -55], rightElbow: [-100, 0, 0], leftShoulder: [-80, 0, 15], leftElbow: [-10, 0, 0], leftHip: [-15, 0, 10], rightHip: [15, 0, -10], leftKnee: [15, 0, 0], rightKnee: [10, 0, 0] }, '人物一臂抬起屈肘，另一臂向前展开，上身扭转，呈投掷动作的静态定格。', '未添加投掷物；没有手指握持或运动轨迹。', 'limited'),
    d('push', '推进', { torso: [12, 0, 0], leftShoulder: [-90, 0, 10], rightShoulder: [-90, 0, -10], leftElbow: [-10, 0, 0], rightElbow: [-10, 0, 0], leftWrist: [-20, 0, 0], rightWrist: [-20, 0, 0], leftHip: [-25, 0, 8], rightHip: [15, 0, -8], leftKnee: [20, 0, 0], rightKnee: [20, 0, 0] }, '人物双臂向前伸出，身体前倾，双腿错开，呈向前推的静态姿态。', '未添加被推物；掌形为现有整体块，非精确掌面接触。', 'limited'),
    d('wave', '招手', { leftShoulder: [-10, 0, 135], leftElbow: [-30, 0, 0], leftWrist: [0, 0, 15], rightShoulder: [0, 0, -8] }, '人物一臂举高并轻微屈肘，呈招手动作的静态定格。', '无手指展开或挥动动画。'),
    d('reach', '伸手', { rightShoulder: [-90, 0, 0], rightElbow: [-5, 0, 0], leftShoulder: [-8, 0, 0], torso: [0, -8, 0] }, '人物一臂向前伸出，另一臂自然放松，呈静态伸手姿态。', '不添加抓取对象或手指抓握。'),
    d('folded-arms', '抱臂', { leftShoulder: [-20, -60, -15], rightShoulder: [-35, 60, 15], leftElbow: [-115, 0, 0], rightElbow: [-120, 0, 0] }, '人物双臂屈肘交叠于身前，呈近似抱臂的静态姿态。', '刚性臂段与固定手块，仅近似交叠，不能手指扣臂或软组织贴合。', 'limited'),
    d('phone', '看手机', { neck: [25, 0, 0], head: [10, 0, 0], leftShoulder: [-35, -35, -10], rightShoulder: [-35, 35, 10], leftElbow: [-95, 0, 0], rightElbow: [-95, 0, 0], leftWrist: [-20, 0, 0], rightWrist: [-20, 0, 0] }, '人物双臂弯曲、双手靠近身前，头颈低垂，呈低头查看的静态姿态。', '未添加手机；无手指握持或屏幕注视求解。', 'limited'),
];
export function builtinPose(id) { const def = builtinPosePresets.find(p => p.id === id); if (!def)
    throw Error('POSE_PRESET_UNKNOWN'); let p = defaultPose(); for (const [j, r] of Object.entries(def.angles))
    p = setJoint(p, j, r); return p; }
export function matchingBuiltin(p) { return builtinPosePresets.find(d => { const q = builtinPose(d.id); return jointIds.every(j => p.joints[j].every((n, i) => n === q.joints[j][i])); }); }
function dispose(o) { const items = new Set(); o.traverse(n => { const m = n; if (m.geometry)
    items.add(m.geometry); for (const material of Array.isArray(m.material) ? m.material : m.material ? [m.material] : [])
    items.add(material); }); items.forEach(i => i.dispose()); }
/** Match StageEngine.placeSubject using rest bounds, preserve X/Z and all existing root angles. No IK. */
export function groundPose(s, p, precise = false) { const root = rootOf(s), rig = createMannequin(); try {
    applyPose(rig, p);
    for (const m of Object.values(rig.markers)) {
        m.removeFromParent();
        dispose(m);
    }
    const size = rig.restBounds.getSize(new T.Vector3()), center = rig.restBounds.getCenter(new T.Vector3()), factor = (s.normalize ? 2 / Math.max(size.x, size.y, size.z) : 1) * s.scale, wrapper = new T.Group();
    rig.object.scale.setScalar(factor);
    rig.object.position.set(-center.x * factor, -rig.restBounds.min.y * factor, -center.z * factor);
    wrapper.rotation.set(...root.rotation.map(T.MathUtils.degToRad), 'YXZ');
    wrapper.add(rig.object);
    wrapper.updateMatrixWorld(true);
    const minY = new T.Box3().setFromObject(wrapper, precise).min.y;
    return { ...root, position: [root.position[0], -minY, root.position[2]] };
}
finally {
    dispose(rig.object);
} }
// Only the two corrected kneels use actual transformed vertices for floor contact.
// Other 18 presets retain their original conservative bounds and exact root output.
export function applyBuiltin(s, id) { if (!isPerson(s))
    throw Error('POSE_PRESET_PERSON_ONLY'); const pose = builtinPose(id); return { ...s, pose, root: groundPose(s, pose, id === 'one-knee' || id === 'both-knees') }; }
export const poseFrame = (s) => ({ pose: poseOf(s), root: rootOf(s) });
