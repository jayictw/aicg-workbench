export type MediaProfile='seedance-input'|'seedance-output'|'seedream-input'|'seedream-output';
export interface MediaMember {
 assetNodeId:string;mediaVersionId:string;sourceId:string;sourceVersionId:string;
 contentSha256:string|null;byteSize:number|null;mimeType:string;
 metadata:{width:number;height:number;durationMs?:number;fps?:number}|{durationMs:number};
 requireAlpha:boolean;z_index?:number;expectedUri?:string;
}
export interface MediaSource extends MediaMember {
 uri:string;permission:'public'|'asset-authorized';availableFromMs:number;expiresAtMs:number;
 assetEntitlement?:'VERIFIED_MOCK'|'HOST_BOUND';downloadURL?:string;
 assetScope?:{accountScopeId:string;provider:'byteplus-modelark';region:'ap-southeast-1';canonicalModelId:string;assetId:string};
}
export interface MediaSet {
 contractKind:'byteplus.media-set';contractVersion:1;provider:'byteplus-modelark';region:'ap-southeast-1';
 canonicalModelId:'dreamina-seedance-2-5-260628'|'dola-seedream-5-0-pro-260628';
 profile:MediaProfile;operation:'single'|'collection'|'layer_decomposition';members:MediaMember[];
}
export interface DecodedMedia {
 fullyDecoded:true;mimeType:string;byteSize:number;contentSha256:string;
 width?:number;height?:number;hasAlpha:boolean;durationMs?:number;fps?:number;
 [key:string]:unknown;
}
export type MediaDecoder=(bytes:Uint8Array,options?:{signal?:AbortSignal})=>Promise<DecodedMedia>;
export interface PinnedGet {
 readonly url:string;readonly address:string;readonly family:4|6;readonly method:'GET';
 readonly headers:Readonly<{Accept:string;'Accept-Encoding':'identity'}>;readonly credentials:'omit';
 readonly redirect:'manual';readonly signal:AbortSignal;
}
export interface MockGetResponse {
 status:number;headers:Record<string,string>;peerAddress:string;body:AsyncIterable<Uint8Array>;close():void;
}
export interface MediaBoundaryOptions {
 mode:'offline-mock'|'byteplus-https';contractAuthority?:object;sourceAuthorization?:object;retainInlineBase64?:boolean;approvedHosts:string[];clock:()=>number;timeoutMs?:number;maxAttempts?:1|2|3;accountScopeId?:string;
 resolveSource:(identity:Readonly<Pick<MediaMember,'assetNodeId'|'mediaVersionId'|'sourceId'|'sourceVersionId'>>)=>Promise<MediaSource>;
 lookup:(hostname:string,options:{signal:AbortSignal})=>Promise<Array<{address:string;family:4|6}>>;
 open:(request:PinnedGet)=>Promise<MockGetResponse>;decode:MediaDecoder;
}
export interface PreparedMediaSet {
 readonly contractKind:'byteplus.prepared-media-set';readonly contractVersion:1;readonly status:'prepared';
 readonly profile:MediaProfile;readonly operation:MediaSet['operation'];
 readonly results:ReadonlyArray<Readonly<MediaMember&{carrier:string;source:Readonly<MediaSource>;byteSize:number;contentSha256:string;b64_json?:string;decoded:DecodedMedia;fullyDecoded:true}>>;
 readonly totalBytes:number;readonly verifiedAtMs:number;readonly executionEnvironment:'offline-mock'|'byteplus-https';
 readonly submissionAuthorization:'BLOCK';readonly publishAuthorization:'BLOCK';readonly uploadAuthorization:'BLOCK';
 readonly accountEntitlement:'UNKNOWN';readonly requiresRevalidation:true;readonly autoPostRetry:false;
}
export function isPublicMediaAddress(address:string):boolean;
/** Size/hash contract only. This does not validate a provider request or permit send. */
export function encodeBytePlusMediaBody(body:unknown):Readonly<{body:unknown;json:string;byteLength:number;bodySha256:string;submissionAuthorization:'BLOCK';uploadAuthorization:'BLOCK';autoPostRetry:false;requiresNewPaidConfirmation:true}>;
export function createBytePlusMediaBoundary(options:MediaBoundaryOptions):Readonly<{
 prepareSet(value:MediaSet,options?:{signal?:AbortSignal}):Promise<PreparedMediaSet>;
 /** Uses B4's branded parser, preserves coordinates/usage/order and prepares all URLs atomically. */
 prepareImageResponse(response:unknown,artifact:unknown,options?:{locateOutput?:(result:any)=>Promise<MediaMember>;signal?:AbortSignal}):Promise<any>;
 mode:'offline-mock';productionTransport:'BLOCK';uploadAuthorization:'BLOCK';
}>;
