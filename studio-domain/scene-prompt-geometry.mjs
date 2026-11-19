import * as T from 'three';
/** Conservative camera-space AABB evidence, not image understanding or occlusion testing. */
export function promptGeometry(box, camera, light) {
    camera.updateMatrixWorld(true);
    light.updateMatrixWorld(true);
    const empty = box.isEmpty(), center = empty ? new T.Vector3() : box.getCenter(new T.Vector3()), size = empty ? 1 : Math.max(.001, box.getSize(new T.Vector3()).length()), delta = light.getWorldPosition(new T.Vector3()).applyMatrix4(camera.matrixWorldInverse).sub(center.clone().applyMatrix4(camera.matrixWorldInverse)), threshold = size * .12;
    const lamp = { type: 'SpotLight', color: '#' + light.color.getHexString(T.SRGBColorSpace), side: delta.x < -threshold ? 'left' : delta.x > threshold ? 'right' : 'near-axis', vertical: delta.y > threshold ? 'above' : delta.y < -threshold ? 'below' : 'near-height' };
    if (empty)
        return { composition: { state: 'unavailable' }, light: lamp };
    const frustum = new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    if (!frustum.intersectsBox(box))
        return { composition: { state: 'outside' }, light: lamp };
    const corners = [];
    for (const x of [box.min.x, box.max.x])
        for (const y of [box.min.y, box.max.y])
            for (const z of [box.min.z, box.max.z])
                corners.push(new T.Vector3(x, y, z));
    if (corners.some(p => -p.clone().applyMatrix4(camera.matrixWorldInverse).z <= camera.near))
        return { composition: { state: 'intersects' }, light: lamp };
    const points = corners.map(p => p.project(camera)), xs = points.map(p => p.x), ys = points.map(p => p.y), bounds = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], forward = camera.getWorldDirection(new T.Vector3());
    return { composition: { state: 'intersects', centerX: center.project(camera).x, clipped: bounds[0] < -1 || bounds[1] < -1 || bounds[2] > 1 || bounds[3] > 1, bounds, pitch: forward.y < -.259 ? 'down' : forward.y > .259 ? 'up' : 'level' }, light: lamp };
}
