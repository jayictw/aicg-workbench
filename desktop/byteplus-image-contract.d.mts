export type ImageOperation = 'generate' | 'interactive_edit' | 'layer_decomposition';
export type ImageSize = Readonly<{kind:'tier';value:'1K'|'1.5K'|'2K'|'auto'}> | Readonly<{kind:'dimensions';width:number;height:number;ratio?:string}>;
export interface ImageReference {
 readonly assetNodeId:string; readonly mediaVersionId:string; readonly contentSha256:string;
 readonly mimeType:'image/png'|'image/jpeg'|'image/webp'; readonly byteSize:number;
 readonly width:number; readonly height:number; readonly hasAlpha:boolean; readonly sequenceIndex:number;
}
export type ImageMark = Readonly<{kind:'point';coordinates:readonly [number,number]}> | Readonly<{kind:'bbox';coordinates:readonly [number,number,number,number]}>;
export interface ImageInput {
 readonly contractKind:'byteplus.image-input'; readonly contractVersion:1;
 readonly provider:'byteplus-modelark'; readonly region:'ap-southeast-1';
 readonly canonicalModelId:'dola-seedream-5-0-pro-260628'; readonly operation:ImageOperation;
 readonly prompt?:string; readonly references:readonly ImageReference[];
 readonly edit?:Readonly<{assetNodeId:string;mediaVersionId:string;marks:readonly ImageMark[]}>;
 readonly output:Readonly<{size:ImageSize;output_format:'png'|'jpeg';response_format:'url'|'b64_json';watermark:boolean;background:'opaque'|'transparent';optimize_prompt_options:Readonly<{mode:'standard'|'fast'}>}>;
}
export interface ResolvedImage {
 readonly status:'available'; readonly assetNodeId:string; readonly currentMediaVersionId:string;
 readonly version:Omit<ImageReference,'assetNodeId'|'sequenceIndex'>;
 readonly expiresAtMs:number|null; readonly bytes:Uint8Array;
}
export interface ImageContext {readonly endpointSelector?:`ep-${string}`;clock:()=>number;resolveMedia?:(identity:Readonly<{assetNodeId:string;mediaVersionId:string}>)=>Promise<ResolvedImage|null>}
declare const requestBrand:unique symbol;
export interface ImageRequestArtifact {
 readonly [requestBrand]:true; readonly contractKind:'byteplus.image-request';readonly contractVersion:1;
 readonly operation:ImageOperation;readonly body:Readonly<{model:string;prompt?:string;size:string;output_format:'png'|'jpeg';response_format:'url'|'b64_json';watermark:boolean;background:'opaque'|'transparent';optimize_prompt_options:Readonly<{mode:'standard'|'fast'}>;layer_decomposition?:true;image?:readonly string[]}>;
 readonly json:string;readonly byteLength:number;readonly bodySha256:string;readonly mediaBindings:readonly ImageReference[];
 readonly editBinding?:Readonly<{assetNodeId:string;mediaVersionId:string;sequenceIndex:number;marks:readonly ImageMark[]}>;
 readonly route:Readonly<{provider:string;region:string;canonicalModelId:string;selectorKind:'endpoint_id';selectorValue:string;contractVersion:3}>;
 readonly preparedAtMs:number;readonly accountEntitlement:'UNKNOWN';readonly endpointBinding:'UNKNOWN';readonly submissionAuthorization:'BLOCK';readonly requiresRevalidation:true;readonly requiresNewPaidConfirmation:true;readonly autoPostRetry:false;
}
export interface ImageResult {
 readonly wireIndex:number;readonly z_index:number;readonly width:number;readonly height:number;
 readonly output_format:'png'|'jpeg';readonly mimeType:'image/png'|'image/jpeg';readonly resultId:string;
 readonly name?:string;readonly description?:string;readonly bounding_box?:Readonly<{absolute:readonly number[];normalized:readonly number[]}>;
 readonly b64_json?:string;readonly byteSize?:number;readonly contentSha256?:string;
 readonly url?:string;readonly expiresAtMs?:number;readonly sourceTrust?:'UNVERIFIED';readonly transportAuthorization?:'BLOCK';
 readonly hasAlpha?:boolean;readonly fullyDecoded?:true;
}
declare const parsedBrand:unique symbol;
export interface ParsedImageSet {
 readonly [parsedBrand]:true;readonly contractKind:'byteplus.image-results';readonly contractVersion:1;
 readonly status:'parsed';readonly operation:ImageOperation;readonly created:number;readonly model:string;
 readonly usage:Readonly<Partial<Record<'generated_images'|'input_images'|'output_tokens'|'total_tokens',number>>>;
 readonly results:readonly ImageResult[];readonly bodySha256:string;readonly mediaBindings:readonly ImageReference[];
 readonly requiresAlpha:boolean;readonly requiresDecode:true;readonly publishAuthorization:'BLOCK';readonly autoPostRetry:false;
}
export interface FailedImageSet {readonly contractKind:'byteplus.image-results';readonly contractVersion:1;readonly status:'failed';readonly errorCode:string;readonly results:readonly [];readonly bodySha256:string;readonly publishAuthorization:'BLOCK';readonly autoPostRetry:false}
export type PreparedImageSet = Omit<ParsedImageSet,'status'|'requiresDecode'|'results'> & Readonly<{status:'prepared';requiresDecode:false;results:readonly (ImageResult & {readonly hasAlpha:boolean;readonly fullyDecoded:true})[]}>;
export function validateSeedreamSize(value:ImageSize,operation:ImageOperation):string;
export function serializeBytePlusImageRequest(value:ImageInput,context:ImageContext):Promise<ImageRequestArtifact>;
export function parseBytePlusImageResponse(value:unknown,artifact:ImageRequestArtifact):ParsedImageSet|FailedImageSet;
/** Trusted local full decoder only. No fetching, publishing, saving or spend authority. */
export function prepareBytePlusImageResults(parsed:ParsedImageSet,context:{decodeImage:(bytes:Uint8Array)=>Promise<{width:number;height:number;mimeType:'image/png'|'image/jpeg';hasAlpha:boolean;fullyDecoded:true}>}):Promise<PreparedImageSet>;
