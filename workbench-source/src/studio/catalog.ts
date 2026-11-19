import type { RefImage } from './state.ts'
export const sampleAssets: RefImage[] = [
  ...(['front', 'side', 'top'] as const).map((view, i): RefImage => ({ id: `bottle-${view}`, category: 'product', src: `/assets/m2/bottle-${view}.svg`, name: '几何容器', entityId: 'sample-bottle', view: ['正面', '侧面', '俯视'][i], origin: 'sample' })),
  ...(['lin', 'he'] as const).flatMap((person, p) => (['front', 'side'] as const).map((view, i): RefImage => ({ id: `${person}-${view}`, category: 'character', src: `/assets/m2/${person}-${view}.svg`, name: p ? '角色·禾' : '角色·林', entityId: `sample-${person}`, view: i ? '侧面' : '正面', origin: 'sample' }))),
  { id: 'scene-landscape', category: 'scene', src: '/assets/landscape.svg', name: '山水旷野', entityId: 'sample-landscape', view: '全景', origin: 'sample' },
  { id: 'scene-objects', category: 'scene', src: '/assets/objects.svg', name: '几何空间', entityId: 'sample-objects', view: '全景', origin: 'sample' },
  { id: 'style-ribbon', category: 'style', src: '/assets/ribbon.svg', name: '柔光流线', entityId: 'sample-ribbon', view: '材质', origin: 'sample' },
  { id: 'style-orbit', category: 'style', src: '/assets/orbit.svg', name: '蓝色轨道', entityId: 'sample-orbit', view: '色调', origin: 'sample' },
]
