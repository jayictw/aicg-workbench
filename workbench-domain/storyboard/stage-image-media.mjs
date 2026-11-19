export async function prepareStageImage(c) {
    const response = await fetch(c.ref.src);
    if (!response.ok)
        throw new Error('任务图片读取失败，请重新选择。');
    const blob = await response.blob();
    if (blob.size > 20 * 1024 * 1024)
        throw new Error('图片超过20MB，本轮不选入。');
    const url = URL.createObjectURL(blob);
    try {
        const image = new Image();
        image.src = url;
        await image.decode();
        if (image.naturalWidth !== c.width || image.naturalHeight !== c.height)
            throw new Error('PNG尺寸与解码结果不一致。');
        const hex = (a) => Array.from(new Uint8Array(a)).map(n => n.toString(16).padStart(2, '0')).join(''), pngSha256 = hex(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())), sourceVersion = hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(c.token)));
        return { sourceToken: c.token, src: c.ref.src, width: c.width, height: c.height, pngSha256, sourceVersion };
    }
    catch (error) {
        throw new Error('图片无法安全解码或建立快照：' + error.message);
    }
    finally {
        URL.revokeObjectURL(url);
    }
}
