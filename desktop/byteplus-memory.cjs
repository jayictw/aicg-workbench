'use strict';
const imageCatalog=require('../shared/byteplus-image-models.json');
const {error}=require('./media.cjs');
class BytePlusMemoryConnection{
 #key=null;
 #authorization=Object.freeze({});
 authorizationIdentity(){return this.#authorization;}
 connect(secret){if(typeof secret!=='string'||secret.length<16||secret.length>4096||!/^[\x21-\x7e]+$/.test(secret))throw error('BYTEPLUS_KEY_FORMAT','請在本機輸入有效格式的API Key');this.clear();this.#key=Buffer.from(secret,'utf8');return this.status();}
 clear(){this.#authorization=Object.freeze({});this.#key?.fill(0);this.#key=null;return this.status();}
 status(){return {service:'BytePlus',connected:!!this.#key,identityVerified:false,imageModel:imageCatalog.defaultModel,videoModel:'dreamina-seedance-2-5-260628',storage:'current-process-memory-only',verification:'configured-locally-not-api-validated'};}
 async withKey(context,invoke){if(!this.#key)throw error('BYTEPLUS_NOT_CONNECTED','目前沒有本機連接');if(!['image','submit','query'].includes(context.phase))throw error('BYTEPLUS_KEY_SCOPE','此動作不可取得憑據');return invoke(this.#key.toString('utf8'));}
}
module.exports={BytePlusMemoryConnection};
