import type { StoryboardSupplement } from '../storyboard/types.ts'
// Session-only provenance. No scene references, API calls or persistent media storage.
export type StageProvenance = { version: 1; taskId: string; snapshotId: string; sceneSignature: string; outputId?: string; createdAt: string; ruleVersion: string; manual: boolean; promptSourceJson?:string }
export type StageSupplement = { text: string; enabled: boolean; manual: boolean; source: StageProvenance }
export function finalPrompt(d: { prompt: string; supplement?: StageSupplement; storyboardSupplement?:StoryboardSupplement }) {
 const supplement=d.supplement, storyboard=d.storyboardSupplement
 if(!storyboard?.enabled || !storyboard.text.trim())return supplement?.enabled && supplement.text.trim() ? [d.prompt, '摄影棚补充：\n'+supplement.text].filter(s=>s.trim()).join('\n\n') : d.prompt
 return [d.prompt,'分镜补充：\n'+storyboard.text,supplement?.enabled&&supplement.text.trim()?'摄影棚补充：\n'+supplement.text:''].filter(s=>s.trim()).join('\n\n')
}
