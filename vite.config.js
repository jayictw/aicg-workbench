import {defineConfig} from 'vite';
// Renderer receives capability/model data, never the developer account binding.
// The actual per-install route is supplied by the native shared UI context.
export function portableImageCatalog(value){
 const out=structuredClone(value);
 for(const model of out.models)if(model.endpointRoute){model.endpointRoute.id=null;model.endpointRoute.declaredProject=null;}
 out.routing='Pro uses the installation Endpoint configuration; default is unconfigured. Account binding is not verified.';
 return out;
}
export function portableRouteCatalog(name,value){
 if(name==='byteplus-image-models.json')return portableImageCatalog(value);
 const out=structuredClone(value);
 if(name==='byteplus-video-route.json'){out.endpointId=null;out.source='INSTALLATION_UNCONFIGURED';}
 else if(name==='byteplus-route-contract.json')for(const model of out.models){model.selectorValue=null;model.selectorProvenance='INSTALLATION_UNCONFIGURED';}
 else throw Error('Unknown portable route catalog');
 return out;
}
export default defineConfig({plugins:[{name:'portable-account-metadata',enforce:'pre',transform(code,id){
 const clean=id.split('?')[0].replaceAll('\\','/'),name=clean.split('/').at(-1);
 if(clean.includes('/shared/')&&['byteplus-image-models.json','byteplus-video-route.json','byteplus-route-contract.json'].includes(name))return {code:JSON.stringify(portableRouteCatalog(name,JSON.parse(code))),map:null};
}}]});
