const fail=(message:string):never=>{throw new Error(message)}
export function imageSize(bytes: Uint8Array, mime: string): [number, number] {
 const d = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
 if (mime === 'image/png') { if (bytes.length < 24 || d.getUint32(0) !== 0x89504e47 || d.getUint32(4) !== 0x0d0a1a0a || d.getUint32(12) !== 0x49484452) fail('嵌入 PNG 头无效。'); return [d.getUint32(16), d.getUint32(20)] }
 if (mime === 'image/jpeg') {
  if (bytes.length < 4 || d.getUint16(0) !== 0xffd8) fail('嵌入 JPEG 头无效。')
  let p = 2
  while (p + 4 <= bytes.length) { if (bytes[p++] !== 255) fail('JPEG 标记无效。'); while (bytes[p] === 255) p++; const m = bytes[p++]; if (m === 217 || m === 218) break; if (m === 1 || m >= 208 && m <= 215) continue; const n = d.getUint16(p); if (n < 2 || p + n > bytes.length) fail('JPEG 数据截断。'); if ([192, 193, 194].includes(m)) { if (n < 7) fail('JPEG 尺寸无效。'); return [d.getUint16(p + 5), d.getUint16(p + 3)] }; p += n }
 }
 return fail('仅支持内嵌 PNG/JPEG 贴图，且需有可识别的尺寸。')
}
