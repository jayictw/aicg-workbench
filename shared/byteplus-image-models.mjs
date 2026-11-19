import catalog from './byteplus-image-models.json' with {type:'json'};
export const IMAGE_CATALOG=catalog;
export const DEFAULT_IMAGE_MODEL=catalog.defaultModel;
export const IMAGE_MODELS=catalog.models;
export const imageModel=id=>catalog.models.find(m=>m.id===id)??null;
export const supportsImageModel=id=>!!imageModel(id);
// Informational list estimate; no billing lookup or account verification.
export function imagePriceEstimate(){return null;}

export const imageSizes=id=>imageModel(id)?.sizes??[];
export const supportsImageSize=(id,size)=>id==='doubao-seedream-5-0-flash-260915'?size==='1024x1024':imageSizes(id).some(s=>s.size===size);
