import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { inspectBackdrop } from './background-state.mjs';
self.onmessage = async (event) => {
    try {
        const { buffer, kind } = event.data, info = inspectBackdrop(buffer, kind);
        if (kind === 'image') {
            let bitmap;
            try {
                bitmap = await createImageBitmap(new Blob([buffer], { type: info.mime }), { imageOrientation: 'flipY', premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
                if (bitmap.width > 4096 || bitmap.height > 4096 || bitmap.width * bitmap.height > 8 * 1024 * 1024)
                    throw new Error('解码尺寸超过保护限制。');
                self.postMessage({ ok: true, kind, bitmap, info: { width: bitmap.width, height: bitmap.height, mime: info.mime } }, { transfer: [bitmap] });
            }
            catch (error) {
                bitmap?.close();
                throw new Error(`普通背景图片无法解码：${error instanceof Error ? error.message : '未知格式'}`);
            }
        }
        else {
            const decoded = new HDRLoader().parse(buffer);
            if (decoded.width !== info.width || decoded.height !== info.height || (!(decoded.data instanceof Uint16Array) || decoded.data.length !== info.width * info.height * 4))
                throw new Error('HDR解析结果与头部不一致。');
            let max = 0;
            for (const v of decoded.data) {
                if ((v & 0x7c00) === 0x7c00)
                    throw new Error('HDR包含无效/无限辐射值。');
                max = Math.max(max, v);
            }
            self.postMessage({ ok: true, kind, data: decoded.data, info: { ...info, maxHalfValue: max } }, { transfer: [decoded.data.buffer] });
        }
    }
    catch (error) {
        self.postMessage({ ok: false, message: error instanceof Error ? error.message : '背景加载失败。' });
    }
};
