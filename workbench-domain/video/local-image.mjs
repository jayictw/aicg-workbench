import { localReference } from '../studio/store.mjs';
export async function decodeLocalImage(file, category, entityId) {
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'].includes(file.type) || file.size > 10 * 1024 * 1024)
        throw new Error(`${file.name}：支持 PNG/JPEG/WebP/GIF/AVIF，单张最多 10 MB。原图已保留。`);
    const src = URL.createObjectURL(file);
    try {
        const image = new Image();
        image.src = src;
        await image.decode();
    }
    catch {
        throw new Error(`${file.name}：图片解码失败，请选择有效图片。原图已保留。`);
    }
    finally {
        URL.revokeObjectURL(src);
    }
    return localReference(file, category, entityId);
}
