const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {boundary}=require('./runtime-paths.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function bounded(root,dir){if(typeof dir!=='string'||dir.length>4096)throw Error('SELECTION_PATH');root=path.resolve(root);dir=path.resolve(dir);const rel=path.relative(root,dir);if(!rel||rel==='..'||rel.startsWith('..'+path.sep)||path.isAbsolute(rel))throw Error('SELECTION_OUTSIDE_ALLOWED_ROOT');boundary(root);boundary(dir);if(!fs.statSync(dir).isDirectory()||fs.realpathSync.native(dir).toLowerCase()!==dir.toLowerCase())throw Error('SELECTION_REALPATH');return dir}
function file(dir,rel,max=512*1024*1024){if(rel!=='complete.json')throw Error('SELECTION_PATH');const f=path.join(dir,rel);boundary(f);const st=fs.statSync(f);if(!st.isFile()||st.size>max)throw Error('SELECTION_SIZE_OR_TYPE');return fs.readFileSync(f)}
function inspect(kind,dir,roots,lease=false){
 dir=bounded(kind==='library'?roots.libraries:roots.backups,dir);
 const compat=require('./compatibility-check.cjs'),r=compat.preflight(dir,roots.identityKind||'S1B-SYNTHETIC-ONLY');let manifestBytes=null;
 if(kind==='backup'){manifestBytes=file(dir,'complete.json');let m;try{m=JSON.parse(manifestBytes)}catch{throw Error('C_CONTENT_CORRUPT')}compat.manifest(m,r);if(m.dbHash!==r.dbHash)throw Error('BACKUP_HASH')}
 const stat=fs.statSync(dir),stamp=hash(Buffer.from(JSON.stringify({dir,dev:stat.dev,ino:stat.ino,birthtime:stat.birthtimeMs,identity:r.identityHash,identityStat:r.identityStat,db:r.dbHash,dbStat:r.dbStat,mediaStamp:r.mediaStamp,manifest:manifestBytes?hash(manifestBytes):null,objects:r.objects})));
 // No Repository, lease, pose initializer or workspace hydrate in this preflight.
 return {name:path.basename(dir),location:dir,libraryId:r.meta.id,revision:r.meta.revision,poseRevision:r.poseRevision,schemaVersion:1,versions:r.versions,eligible:r.eligible,notice:r.eligible?'':'首次改写待单独升级评审',stamp,kind};
}
function destination(root,dir){root=path.resolve(root);dir=path.resolve(dir);const rel=path.relative(root,dir);if(!rel||rel==='..'||rel.startsWith('..'+path.sep)||path.isAbsolute(rel))throw Error('RESTORE_PATH_REJECTED');boundary(root);boundary(dir);const parent=path.dirname(dir);if(!fs.statSync(parent).isDirectory())throw Error('RESTORE_PARENT_NOT_DIRECTORY');if(fs.realpathSync.native(parent).toLowerCase()!==parent.toLowerCase())throw Error('RESTORE_PATH_REJECTED');if(fs.existsSync(dir))throw Error('RESTORE_DESTINATION_EXISTS');return dir}
module.exports={inspect,bounded,destination};


