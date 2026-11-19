import type {BytePlusVideoInput,BytePlusMediaReference,BytePlusMediaContext} from '../shared/byteplus-media-contract.mjs';
export interface BytePlusVideoOutput {
 readonly resolution:'480p'|'720p'|'1080p';
 readonly generate_audio:boolean;
 readonly watermark:boolean;
 readonly output_format:'mp4'|'mov';
}
export interface BytePlusVideoTaskOptions {
 readonly return_last_frame?:boolean;
 readonly priority?:number;
 readonly execution_expires_after?:number;
 readonly service_tier?:'default';
 readonly safety_identifier?:string;
}
export interface BytePlusVideoRequest {
 readonly input:BytePlusVideoInput;
 readonly output:BytePlusVideoOutput;
 readonly lifecycle:'standard'|'draft';
 readonly task?:BytePlusVideoTaskOptions;
}
export interface BytePlusVideoSerializationContext {
 /** Current wall clock is required; no reusable verified-at grant is accepted. */
 readonly clock:()=>number;
 readonly endpointSelector?:`ep-${string}`;
 readonly resolveMedia:BytePlusMediaContext['resolveMedia'];
 /** Privileged main-only capability; JSON URI/verified flags cannot satisfy it. */
 readonly resolveVideoCarrier?:(reference:BytePlusMediaReference,options:{executionExpiresAfter:number})=>Promise<object>;
}
export interface BytePlusDraftTask {
 readonly taskId:string;
 readonly model:'dreamina-seedance-2-5-260628';
 readonly status:'succeeded';
 readonly draft:true;
 readonly created_at:number;
}
export interface BytePlusFinalRequest {
 readonly draftTask:BytePlusDraftTask;
 /** All other parameters are inherited and must be absent, even if equal. */
 readonly output:{readonly resolution:'1080p';readonly watermark?:boolean;readonly output_format?:'mp4'|'mov'};
 readonly task?:BytePlusVideoTaskOptions;
}
export type BytePlusVideoWireContent =
 | Readonly<{type:'text';text:string}>
 | Readonly<{type:'image_url';image_url:Readonly<{url:string}>;role:'first_frame'|'last_frame'|'reference_image'}>
 | Readonly<{type:'video_url';video_url:Readonly<{url:string}>;role:'reference_video'}>
 | Readonly<{type:'audio_url';audio_url:Readonly<{url:string}>;role:'reference_audio'}>
 | Readonly<{type:'draft_task';draft_task:Readonly<{id:string}>}>;
export interface BytePlusVideoWireBody extends BytePlusVideoTaskOptions {
 readonly model:`ep-${string}`;
 readonly content:readonly BytePlusVideoWireContent[];
 readonly resolution:'480p'|'720p'|'1080p';
 readonly duration?:number;
 readonly ratio?:BytePlusVideoInput['parameters']['ratio'];
 readonly generate_audio?:boolean;
 readonly watermark?:boolean;
 readonly output_format?:'mp4'|'mov';
 readonly omni_reference_task_type?:'reference'|'edit'|'extend';
 readonly draft?:true;
}
export interface BytePlusSerializedVideo {
 readonly body:Readonly<BytePlusVideoWireBody>;
 readonly json:string;
 readonly byteLength:number;
 readonly bodySha256:string;
 readonly route:Readonly<{provider:'byteplus-modelark';region:'ap-southeast-1';canonicalModelId:'dreamina-seedance-2-5-260628';selectorKind:'endpoint_id';selectorValue:`ep-${string}`;contractVersion:3}>;
 readonly executionEnvironment:'contract-only'|'contract-mock';
 readonly mediaTransport:'VERIFIED_INLINE_ONLY'|'MOCK_ONLY_NOT_USABLE'|'DRAFT_TASK_REQUIRES_REQUERY';
 readonly mediaBindings:readonly Readonly<BytePlusMediaReference & {wireContentIndex:number}>[];
 readonly verifiedAtMs:number;
 readonly billingStep:'standard-separate-task'|'draft-separate-task'|'final-separate-task';
 readonly draftTaskId?:string;
 readonly draftCreatedAt?:number;
 readonly draftTaskExpiresAtMs?:number;
 readonly requiresDraftRequery?:true;
 readonly accountEntitlement:'UNKNOWN';
 readonly endpointBinding:'UNKNOWN';
 readonly submissionAuthorization:'BLOCK';
 readonly requiresRevalidation:true;
 readonly requiresNewPaidConfirmation:true;
 readonly autoPostRetry:false;
}
export type BytePlusDiagnosticData = null|boolean|number|string|readonly BytePlusDiagnosticData[]|{readonly [key:string]:BytePlusDiagnosticData};
export interface BytePlusVideoResponse {
 readonly taskId:string|null;
 readonly status:string|null;
 readonly knownStatus:boolean;
 readonly identityMatched:boolean;
 readonly httpStatus:number|null;
 readonly created_at:number|null;
 readonly updated_at:number|null;
 readonly model:string|null;
 readonly usage:BytePlusDiagnosticData;
 readonly actualOutput:Readonly<Record<string,BytePlusDiagnosticData>>;
 readonly content:Readonly<{video_url:string|null;last_frame_url:string|null}>;
 readonly draft:boolean|null;
 readonly draft_task_id:string|null;
 readonly taskExpiresAtMs:number|null;
 readonly taskExpired:boolean|null;
 readonly execution_expires_after:number|null;
 readonly executionDeadlineMs:number|null;
 readonly outputURLValiditySeconds:86400;
 readonly outputURLExpiresAtMs:null;
 readonly outputURLExpiryBasis:'NOT_PROVIDED_BY_API_DO_NOT_INFER_FROM_CREATED_AT';
 readonly downloadAuthorized:false;
 readonly error:BytePlusDiagnosticData;
 readonly rawDiagnostics:Readonly<Record<string,BytePlusDiagnosticData>>;
 readonly requestId:string|null;
 readonly parseError:string|null;
 readonly outcome:'accepted'|'observed'|'submissionUnknown'|'queryUnknown';
 readonly autoPostRetry:false;
 readonly submissionAuthorization:'BLOCK';
}
export function serializeBytePlusVideoRequest(request:BytePlusVideoRequest,context:BytePlusVideoSerializationContext):Promise<BytePlusSerializedVideo>;
export function serializeBytePlusVideoMock(request:BytePlusVideoRequest,context:BytePlusVideoSerializationContext):Promise<BytePlusSerializedVideo>;
export function serializeBytePlusFinalRequest(request:BytePlusFinalRequest,context:{readonly clock:()=>number;readonly endpointSelector?:`ep-${string}`}):BytePlusSerializedVideo;
export function parseBytePlusVideoResponse(response:unknown,context:{readonly phase:'submit'|'query';readonly expectedTaskId?:string;readonly nowMs:number;readonly redactValues?:readonly string[]}):BytePlusVideoResponse;
