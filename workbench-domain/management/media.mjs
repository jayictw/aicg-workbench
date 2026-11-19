import { localObjectUrl } from '../studio/store.mjs';
import { decodeLocalImage } from '../video/local-image.mjs';
export const importAccept = 'image/png,image/jpeg,image/webp,video/mp4,audio/wav,audio/x-wav';
export const supportedFormats = '图片 PNG / JPEG / WebP（≤10 MB）；视频 MP4（本轮验证 H.264/AAC）、音频 WAV（PCM），各≤50 MB。其他编码不保证支持。';
export async function prepareAsset(file) {
    if (!file.size)
        throw new Error('空文件，未导入。');
    const images = ['image/png', 'image/jpeg', 'image/webp'], video = file.type === 'video/mp4', audio = ['audio/wav', 'audio/x-wav'].includes(file.type);
    if (!images.includes(file.type) && !video && !audio)
        throw new Error('不支持此文件类型。' + supportedFormats);
    const id = crypto.randomUUID(), now = Date.now();
    if (images.includes(file.type)) {
        const ref = await decodeLocalImage(file, 'scene', id);
        const img = new Image();
        img.src = ref.src;
        await img.decode();
        return { id, name: file.name, fileName: file.name, media: 'image', src: ref.src, usages: [], tags: [], description: '本机导入，仅浏览器内存引用。', favorite: false, example: false, origin: 'local', size: file.size, mime: file.type, lastModified: file.lastModified, width: img.naturalWidth, height: img.naturalHeight, createdAt: now, updatedAt: now };
    }
    if (file.size > 50 * 1024 * 1024)
        throw new Error('视频/音频单个最多 50 MB。');
    const src = await localObjectUrl(file), el = document.createElement(video ? 'video' : 'audio');
    try {
        if (!el.canPlayType(file.type))
            throw new Error('浏览器不支持此媒体类型。');
        const metadata = await new Promise((resolve, reject) => {
            const timer = setTimeout(() => { cleanup(); reject(new Error('媒体解码超时，请换用支持的文件。')); }, 8000);
            const cleanup = () => { clearTimeout(timer); el.onloadeddata = null; el.onerror = null; };
            el.preload = 'auto';
            el.onloadeddata = () => { cleanup(); if (!Number.isFinite(el.duration) || el.duration <= 0) {
                reject(new Error('媒体时长无效，未导入。'));
                return;
            } resolve({ duration: el.duration, ...(el instanceof HTMLVideoElement ? { width: el.videoWidth, height: el.videoHeight } : {}) }); };
            el.onerror = () => { cleanup(); reject(new Error('媒体无法解码，未导入。')); };
            el.src = src;
            el.load();
        });
        return { id, name: file.name, fileName: file.name, media: video ? 'video' : 'audio', src, usages: [], tags: [], description: '本机导入，仅浏览器内存引用。', favorite: false, example: false, origin: 'local', size: file.size, mime: file.type, lastModified: file.lastModified, ...metadata, createdAt: now, updatedAt: now };
    }
    catch (e) {
        URL.revokeObjectURL(src);
        throw e;
    }
    finally {
        el.pause();
        el.removeAttribute('src');
        el.load();
    }
}
