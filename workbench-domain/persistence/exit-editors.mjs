import { useLayoutEffect, useRef } from 'react';
const editors = new Map();
export function useExitGuard(label, pending, busy = false) {
    const key = useRef({});
    useLayoutEffect(() => { editors.set(key.current, { label, pending, busy }); return () => { editors.delete(key.current); }; }, [label, pending, busy]);
}
export const exitEditors = () => Array.from(editors.values()).filter(x => x.pending || x.busy);
let inputRevision = 0;
if (typeof document !== 'undefined')
    document.addEventListener('input', () => { inputRevision++; }, true);
export const exitInputRevision = () => inputRevision;
