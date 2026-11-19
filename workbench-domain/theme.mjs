// Synchronize browser chrome colors without modifying any original media asset.
export function syncThemeChrome() {
    const colors = getComputedStyle(document.documentElement);
    const read = (token) => colors.getPropertyValue(token).trim();
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', read('--page'));
    const icon = document.querySelector('link[rel="icon"]');
    if (icon)
        icon.href = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="${read("--primary")}"/><g fill="none" stroke="${read("--on-primary")}" stroke-width="2.5" stroke-linejoin="round"><circle cx="32" cy="32" r="19"/><path d="m27 14 19 32M44 17 26 49M51 32H14M37 14 18 46M20 18l18 32M13 32h38"/></g></svg>`);
}
