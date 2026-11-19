export const transformSelection = (selected) => selected !== 'background' ? selected : null;
// Serializable scene settings only; observer camera, selection and panel state are UI.
export const sceneChanged = (applied, draft) => JSON.stringify(applied) !== JSON.stringify(draft);
