import type { StageSettings } from './state.ts'
export type StageObject = 'subject' | 'camera' | 'light' | 'background'
export const transformSelection = (selected:StageObject) => selected!=='background'?selected:null
// Serializable scene settings only; observer camera, selection and panel state are UI.
export const sceneChanged = (applied:StageSettings,draft:StageSettings) => JSON.stringify(applied)!==JSON.stringify(draft)
