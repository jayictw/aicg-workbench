import { imageSize } from './image-size.ts'
import { sceneLimits as L } from './state.ts'
export type GLBInfo = { vertices: number; triangles: number; nodes: number; images: number; pixels: number; animated: boolean; embeddedImages: { offset: number; length: number; mime: string; width: number; height: number }[] }
const fail = (message: string): never => { throw new Error(message) }
const integer = (value: unknown, min: number, max: number, label: string): number => typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max ? value : fail(`${label}无效或超出保护限制。`)
export function inspectGLB(buffer: ArrayBuffer): GLBInfo {
 if (buffer.byteLength < 28 || buffer.byteLength > L.fileBytes) fail('GLB 必须非空且不超过 20 MiB。')
 const dv = new DataView(buffer)
 if (dv.getUint32(0, true) !== 0x46546c67 || dv.getUint32(4, true) !== 2 || dv.getUint32(8, true) !== buffer.byteLength) fail('不是有效的 GLB 2.0，或文件已截断。')
 const jsonLength = integer(dv.getUint32(12, true), 2, L.jsonBytes, 'JSON 大小')
 if (dv.getUint32(16, true) !== 0x4e4f534a || 20 + jsonLength + 8 > buffer.byteLength) fail('GLB JSON/BIN 块缺失。')
 let j: any
 try { j = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 20, jsonLength))) } catch { fail('GLB JSON 无法解析。') }
 if (j.asset?.version !== '2.0') fail('只支持 glTF 2.0。')
 const binHeader = 20 + jsonLength, binLength = dv.getUint32(binHeader, true), binOffset = binHeader + 8
 if (dv.getUint32(binHeader + 4, true) !== 0x004e4942 || binLength + binOffset !== buffer.byteLength) fail('只支持一个自包含 BIN 块。')
 const visit = (v: any, depth = 0) => { if (depth > 64) fail('JSON 嵌套过深。'); if (v && typeof v === 'object') { if ('uri' in v) fail('不允许外部或 data URI；请导出完全内嵌的 GLB。'); if (v.extensions && Object.keys(v.extensions).length) fail(`尚不支持扩展：${Object.keys(v.extensions).join('、')}。未下载解码器。`); Object.values(v).forEach(x => visit(x, depth + 1)) } }; visit(j)
 const ext = [...(j.extensionsUsed || []), ...(j.extensionsRequired || [])]; if (ext.length) fail(`尚不支持压缩或扩展：${[...new Set(ext)].join('、')}。`)
 if (j.scenes?.length !== 1) fail('本轮只支持单一场景的主体 GLB。')
 if (j.cameras?.length) fail('本轮只加载主体，请导出不包含内置摄影机的 GLB。')
 if (j.buffers?.length !== 1) fail('只支持单一内嵌 buffer。')
 const bufferLength = integer(j.buffers[0].byteLength, 1, binLength, 'Buffer 长度')
 const views: any[] = j.bufferViews || [], accessors: any[] = j.accessors || [], meshes: any[] = j.meshes || [], nodes: any[] = j.nodes || [], images: any[] = j.images || []
 if (views.length > 2048 || accessors.length > 1024 || meshes.length > 128 || (j.materials || []).length > 64 || nodes.length > L.nodes || images.length > L.images) fail('节点、网格、材质或贴图数量超限（节点256、网格128、材质64、贴图8）。')
 for (const v of views) { if ((v.buffer ?? 0) !== 0) fail('Buffer 索引无效。'); const off = integer(v.byteOffset ?? 0, 0, bufferLength, 'BufferView 偏移'); integer(v.byteLength, 1, bufferLength - off, 'BufferView 长度'); if (v.byteStride !== undefined) integer(v.byteStride, 4, 252, '交错步长') }
 let accessorBytes = 0
 for (const a of accessors) {
  if (a.sparse) fail('本轮尚不支持稀疏 accessor。')
  const components = ({ SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 } as Record<string, number>)[a.type], bytes = ({5120:1,5121:1,5122:2,5123:2,5125:4,5126:4} as Record<number, number>)[a.componentType]
  if (!components || !bytes) fail('Accessor 类型无效。')
  const count = integer(a.count, 1, 500000, 'Accessor 数量'), view = views[integer(a.bufferView, 0, views.length - 1, 'Accessor bufferView')], offset = integer(a.byteOffset ?? 0, 0, view.byteLength, 'Accessor 偏移'), size = components * bytes, stride = view.byteStride || size
  if (stride < size || offset + stride * (count - 1) + size > view.byteLength) fail('Accessor 超出 bufferView 范围。')
  accessorBytes += count * size
 }
 if (accessorBytes > L.accessorBytes) fail('展开后的 accessor 数据超过 32 MiB。')
 const counts = meshes.map(m => {
  if (!Array.isArray(m.primitives) || !m.primitives.length) fail('网格没有有效图元。')
  let vertices = 0, triangles = 0
  for (const p of m.primitives) {
   if ((p.mode ?? 4) !== 4) fail('本轮只支持三角形图元。')
   const a = accessors[integer(p.attributes?.POSITION, 0, accessors.length - 1, 'POSITION 索引')]
   if (a.type !== 'VEC3' || a.componentType !== 5126) fail('POSITION 需要 FLOAT VEC3。')
   if (a.count > L.vertices) fail('网格顶点超过15万。')
   const pv = views[a.bufferView], positionOffset = binOffset + (pv.byteOffset || 0) + (a.byteOffset || 0), positionStride = pv.byteStride || 12
   for (let i=0;i<a.count;i++) for (let axis=0;axis<3;axis++) if (!Number.isFinite(dv.getFloat32(positionOffset+i*positionStride+axis*4,true))) fail('顶点含非有限数值。')
   vertices += a.count
   let n = a.count
   if (p.indices !== undefined) {
    const index = accessors[integer(p.indices, 0, accessors.length - 1, '索引 accessor')], sizes: Record<number,number> = {5121:1,5123:2,5125:4}, size = sizes[index.componentType]
    if (index.type !== 'SCALAR' || !size) fail('三角形索引需为无符号整数。')
    const view = views[index.bufferView], offset = binOffset + (view.byteOffset || 0) + (index.byteOffset || 0), stride = view.byteStride || size
    for (let i=0;i<index.count;i++) {const at=offset+i*stride,value=size===1?dv.getUint8(at):size===2?dv.getUint16(at,true):dv.getUint32(at,true);if(value>=a.count)fail('三角形索引超出顶点范围。')}
    n = index.count
   }
   if (n % 3) fail('三角形索引数量无效。')
   triangles += n / 3
  }
  return { vertices, triangles, primitives: m.primitives.length }
 })
 let vertices = 0, triangles = 0, primitives = 0
 const visited = new Set<number>(), path = new Set<number>(), parents = new Set<number>()
 for(const node of nodes)for(const child of node.children||[]){integer(child,0,nodes.length-1,'子节点');if(parents.has(child))fail('不支持多父级节点。');parents.add(child)}
 const walk = (index: number, depth: number) => { integer(index, 0, nodes.length - 1, '节点索引'); if (depth > L.depth || path.has(index)) fail('节点循环引用或层级超过32。'); if (visited.has(index)) return; visited.add(index); path.add(index); const n = nodes[index]; if (n.mesh !== undefined) { const c = counts[integer(n.mesh, 0, counts.length - 1, 'Mesh 索引')]; vertices += c.vertices; triangles += c.triangles; primitives += c.primitives }; for (const key of ['translation', 'rotation', 'scale', 'matrix']) if (n[key] && (!Array.isArray(n[key]) || n[key].some((v: unknown) => typeof v !== 'number' || !Number.isFinite(v) || Math.abs(v) > 100000))) fail('节点变换无效或过大。'); for (const child of n.children || []) { walk(child, depth + 1) }; path.delete(index) }
 for (let i = 0; i < nodes.length; i++) if(!parents.has(i))walk(i, 0)
 if(visited.size!==nodes.length)fail('节点含循环引用。')
 if (!vertices || vertices > L.vertices || triangles > L.triangles || primitives > L.primitives) fail('场景超限：最多15万顶点、15万三角形、128图元（含实例）。')
 const embeddedImages: GLBInfo['embeddedImages'] = []
 let pixels = 0
 for (const image of images) { const v = views[integer(image.bufferView, 0, views.length - 1, '贴图 bufferView')]; if (v.byteLength > L.imageBytes) fail('单张压缩贴图超过4 MiB。'); const [w,h] = imageSize(new Uint8Array(buffer, binOffset + (v.byteOffset || 0), v.byteLength), image.mimeType); if (!w || !h || w > L.imageEdge || h > L.imageEdge) fail('贴图尺寸不得超过2048×2048。'); pixels += w * h; embeddedImages.push({offset:binOffset+(v.byteOffset||0),length:v.byteLength,mime:image.mimeType,width:w,height:h}) }
 if (pixels > L.imagePixels) fail('贴图总像素超过16 MP。')
 return { vertices, triangles, nodes: nodes.length, images: images.length, pixels, animated: !!j.animations?.length, embeddedImages }
}
