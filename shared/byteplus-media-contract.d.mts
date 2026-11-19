export type BytePlusVideoMode = 'TEXT_TO_VIDEO' | 'FIRST_FRAME' | 'FIRST_LAST_FRAME' | 'MULTI_IMAGE_REFERENCE' | 'VIDEO_REFERENCE';
export type BytePlusVideoOperation = 'generate' | 'reference' | 'edit' | 'extend';
export interface MediaSource {
 readonly kind: 'project' | 'upload' | 'remote';
 readonly sourceId: string;
 readonly createdAtMs: number;
 /** null is allowed only for durable project-owned media. */
 readonly expiresAtMs: number | null;
}
export interface MediaAvailability { readonly availableFromMs: number; readonly expiresAtMs: number | null }
interface MediaReferenceBase {
 readonly assetNodeId: string;
 readonly mediaVersionId: string;
 readonly contentSha256: string;
 readonly byteSize: number;
 readonly sequenceIndex: number;
 readonly source: MediaSource;
 readonly availability: MediaAvailability;
}
export interface ImageMediaReference extends MediaReferenceBase {
 readonly mediaKind: 'image';
 readonly role: 'FIRST_FRAME' | 'LAST_FRAME' | 'REFERENCE_IMAGE';
 readonly mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/bmp' | 'image/tiff' | 'image/gif' | 'image/heic' | 'image/heif';
 readonly metadata: { readonly width: number; readonly height: number };
}
export interface VideoMediaReference extends MediaReferenceBase {
 readonly mediaKind: 'video';
 readonly role: 'REFERENCE_VIDEO';
 readonly mimeType: 'video/mp4' | 'video/quicktime';
 readonly metadata: { readonly width: number; readonly height: number; readonly durationMs: number; readonly fps: number };
}
export interface AudioMediaReference extends MediaReferenceBase {
 readonly mediaKind: 'audio';
 readonly role: 'REFERENCE_AUDIO';
 readonly mimeType: 'audio/wav' | 'audio/mpeg';
 readonly metadata: { readonly durationMs: number };
}
export type BytePlusMediaReference = ImageMediaReference | VideoMediaReference | AudioMediaReference;
export interface BytePlusVideoInput {
 readonly contractKind: 'byteplus.video-input';
 readonly contractVersion: 1;
 readonly provider: 'byteplus-modelark';
 readonly region: 'ap-southeast-1';
 readonly canonicalModelId: 'dreamina-seedance-2-5-260628';
 readonly mode: BytePlusVideoMode;
 /** Internal intent only. Does not extend B1 routeContract.operation. */
 readonly operation: BytePlusVideoOperation;
 readonly prompt?: string;
 readonly mediaReferences: readonly BytePlusMediaReference[];
 readonly parameters: { readonly duration: number; readonly ratio: 'adaptive' | '16:9' | '4:3' | '1:1' | '3:4' | '9:16' | '21:9' };
}
type WithoutSelection<T> = T extends unknown ? Omit<T,'assetNodeId' | 'role' | 'sequenceIndex'> : never;
export interface ResolvedBytePlusMedia {
 readonly status: 'available' | 'deleted' | 'unavailable';
 readonly assetNodeId: string;
 readonly currentMediaVersionId: string;
 /** Authoritative metadata from a trusted local media/decoder adapter. */
 readonly version: WithoutSelection<BytePlusMediaReference>;
 readonly bytes: Uint8Array;
}
export interface BytePlusMediaContext {
 readonly nowMs: number;
 readonly resolveMedia: (identity: Readonly<{assetNodeId: string; mediaVersionId: string}>) => Promise<ResolvedBytePlusMedia | null> | ResolvedBytePlusMedia | null;
}
export interface BytePlusValidatedInput {
 readonly contract: BytePlusVideoInput;
 readonly validationLevel: 'schema-only';
 readonly counts: Readonly<{image:number;video:number;audio:number}>;
 readonly totalDurationMs: Readonly<{video:number;audio:number}>;
 readonly inputCapacity: Readonly<{image:30;video:10;audio:10}>;
 readonly accountEntitlement: 'UNKNOWN';
 readonly submissionAuthorization: 'BLOCK';
 readonly requestBodyMaxBytes: 64000000;
 readonly requestBodyValidation: 'DEFERRED_TO_B3_SERIALIZATION';
 readonly providerPromptIntent: 'NOT_EVALUATED';
 readonly sourceRefs: readonly string[];
}
export interface BytePlusPreparedInput extends Omit<BytePlusValidatedInput,'validationLevel'> {
 readonly validationLevel: 'verified-bytes';
 readonly verifiedAtMs: number;
}
export const BYTEPLUS_MEDIA_LIMITS: Readonly<{
 contractKind:'byteplus.video-input';contractVersion:1;provider:'byteplus-modelark';region:'ap-southeast-1';canonicalModelId:'dreamina-seedance-2-5-260628';
 modes:readonly BytePlusVideoMode[];operations:readonly BytePlusVideoOperation[];maxReferences:Readonly<{image:30;video:10;audio:10}>;
 maxFileBytes:Readonly<{image:30000000;video:200000000;audio:15000000}>;imageFileLimitExclusive:true;
 minDurationMs:2000;maxDurationMs:30000;editVideoMinDurationMs:4000;totalDurationMs:Readonly<{video:30000;audio:30000}>;
 requestBodyMaxBytes:64000000;sourceRefs:readonly string[];
}>;
export function validateBytePlusVideoInput(input: unknown): BytePlusValidatedInput;
export function prepareBytePlusVideoInput(input: unknown, context: BytePlusMediaContext): Promise<BytePlusPreparedInput>;
