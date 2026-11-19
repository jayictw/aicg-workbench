import { DesktopPoseRepository, desktopPoses } from '../persistence/pose-repository.mjs';
import { nameKey, validateAdditions, verifiedRecord } from './pose-library-state.mjs';
export const poseDatabaseName = 'acs-pose-library-v1';
export class IndexedDbPoseRepository {
    databaseName;
    constructor(databaseName = poseDatabaseName) {
        this.databaseName = databaseName;
    }
    open() { return new Promise((resolve, reject) => { if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB不可用；当前姿势保留，可导出JSON。'));
        return;
    } let settled = false; const timer = setTimeout(() => fail(new Error('打开姿势库超时，请关闭其他旧版页面后重试。')), 7000); function fail(error) { if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(error);
    } } let request; try {
        request = indexedDB.open(this.databaseName, 1);
    }
    catch (e) {
        fail(e);
        return;
    } request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('poses'))
        request.result.createObjectStore('poses', { keyPath: 'id' }); }; request.onerror = () => fail(request.error); request.onblocked = () => fail(new Error('姿势库被其他旧版页面占用，请关闭后重试。')); request.onsuccess = () => { const db = request.result; if (settled) {
        db.close();
        return;
    } settled = true; clearTimeout(timer); db.onversionchange = () => db.close(); resolve(db); }; }); }
    async transaction(mode, action) { const db = await this.open(); try {
        return await new Promise((resolve, reject) => { let answer, cause; let tx; try {
            tx = db.transaction('poses', mode);
        }
        catch (e) {
            reject(e);
            return;
        } tx.oncomplete = () => resolve(answer); tx.onabort = () => reject(cause || tx.error || new Error('姿势库交易已中止，未完成写入。')); tx.onerror = () => { cause = cause || tx.error; }; try {
            const store = tx.objectStore('poses'), request = store.getAll();
            request.onerror = () => { cause = request.error; };
            request.onsuccess = () => { try {
                answer = action(request.result.map(verifiedRecord), store);
            }
            catch (e) {
                cause = e;
                tx.abort();
            } };
        }
        catch (e) {
            cause = e;
            tx.abort();
        } });
    }
    finally {
        db.close();
    } }
    list() { return this.transaction('readonly', rows => rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id))); }
    add(records) { const copies = records.map(verifiedRecord); return this.transaction('readwrite', (rows, store) => { validateAdditions(rows, copies); for (const row of copies)
        store.add(row); }); }
    replace(record, expectedRevision) { const copy = verifiedRecord(record); return this.transaction('readwrite', (rows, store) => { const current = rows.find(r => r.id === copy.id); if (!current || current.revision !== expectedRevision)
        throw new Error('此姿势已在另一处更新，请刷新姿势库后重新操作；未覆盖。'); if (copy.revision !== current.revision + 1 || copy.createdAt !== current.createdAt)
        throw new Error('记录修订不连续，未写入。'); if (rows.some(r => r.id !== copy.id && nameKey(r.name) === nameKey(copy.name)))
        throw new Error('名称已存在（含回收区），未覆盖。'); store.put(copy); }); }
}
export const poseRepository = typeof window !== 'undefined' && window.workLibrary ? new DesktopPoseRepository() : new IndexedDbPoseRepository();
export const poseScope = () => typeof window !== 'undefined' && window.workLibrary ? desktopPoses.get().cap : 'browser';
