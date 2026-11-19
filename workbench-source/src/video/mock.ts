// Fictional demo rules, deliberately independent of provider claims/versions.
export type VideoModel = 'veo' | 'seedance'
export type VideoMode = 'text' | 'first' | 'frames'
export const modeLabels: Record<VideoMode, string> = { text: '文字生成', first: '首帧生成', frames: '首尾帧生成' }
export const videoModels: Record<VideoModel, string> = { veo: 'Veo', seedance: 'Seedance' }
export const videoMock = {
  veo: { profile: 'Mock V', modes: ['text', 'first', 'frames'], ratios: ['16:9', '9:16', '1:1'], durations: [4, 6, 8], resolutions: ['360p', '720p'], maxCount: 4, maxRefs: 6, maxCharacters: 2 },
  seedance: { profile: 'Mock S', modes: ['text', 'first'], ratios: ['16:9', '9:16'], durations: [4, 6], resolutions: ['360p'], maxCount: 2, maxRefs: 3, maxCharacters: 1 },
} satisfies Record<VideoModel, { profile: string; modes: string[]; ratios: string[]; durations: number[]; resolutions: string[]; maxCount: number; maxRefs: number; maxCharacters: number }>
export const sampleVideo = { src: '/assets/m3/local-demo.mp4', poster: '/assets/m3/local-demo.jpg', width: 640, height: 360, duration: 4, ratio: '16:9' }
