export const IMAGE_UI_MODES:string[];
export const IMAGE_UI_LABELS:Record<string,string>;
export function imageIdentity(ref:any):string;
export function imagePoint(rect:any,x:number,y:number):number[]|null;
export function imageBox(a:number[]|null,b:number[]|null):number[]|null;
export function buildImageUiRequest(value:any):any;
export function imageUiOptions(saved?:any,overrides?:any,mode?:string):any;
