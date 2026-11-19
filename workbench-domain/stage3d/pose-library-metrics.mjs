const urls = new Set();
export const poseLibraryMetrics = { thumbnailCreated: 0, thumbnailDisposed: 0, thumbnailActive: 0, thumbnailMaxActive: 0, thumbnailQueued: 0, urlsCreated: 0, urlsRevoked: 0, urlsActive: 0 };
export function publishLibraryMetrics() { if (typeof document !== 'undefined')
    document.documentElement.dataset.poseLibraryLifecycle = JSON.stringify(poseLibraryMetrics); }
export function libraryUrl(blob) { const url = URL.createObjectURL(blob); urls.add(url); poseLibraryMetrics.urlsCreated++; poseLibraryMetrics.urlsActive = urls.size; publishLibraryMetrics(); return url; }
export function revokeLibraryUrl(url) { if (urls.delete(url)) {
    URL.revokeObjectURL(url);
    poseLibraryMetrics.urlsRevoked++;
    poseLibraryMetrics.urlsActive = urls.size;
    publishLibraryMetrics();
} }
if (typeof window !== 'undefined')
    window.addEventListener('pagehide', e => { if (!e.persisted)
        for (const url of [...urls])
            revokeLibraryUrl(url); });
