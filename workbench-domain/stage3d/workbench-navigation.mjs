// Router-level boundary: a component-level hash listener runs too late to stop App unmounting.
let guard = null;
export function holdWorkbenchNavigation(next) {
    guard = next;
    return () => { if (guard === next)
        guard = null; };
}
export function allowWorkbenchRouteChange() {
    if (!guard)
        return true;
    guard(window.location.href);
    return false;
}
