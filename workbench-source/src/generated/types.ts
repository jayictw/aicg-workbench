// D1 shared types: r2-b713 contract. No runtime provider or credential rights.
export type Int=number;export type Hash=string;export type MediaId=string;
export type PlatformId = 'google'|'bytedance'|'openai'|'xai'|'runway'|'kling';
export type Operation = 'text-to-image'|'image-edit'|'text-to-video'|
  'first-frame-to-video'|'first-last-to-video'|'reference-to-video';
export type Target1 = {
  platformId:PlatformId;
  serviceId:string; serviceRevision:Int; //ID 1..128 ASCII；revision>=1
  region:string | null; //1..64 ASCII或null，未知不得填假地区
  apiOrigin:string; //实际接收服务，规范HTTPS origin；不是CDN URL
  serviceTrust:'official-preset'|'user-custom';
  requestedModel:string; //1..200 ASCII，无空白
  modelVersion:string | null; //1..200 ASCII；无官方固定快照则null
  modelPresetId:string; modelPresetRevision:Int; //1..128 ASCII，revision>=1
  adapterId:string; adapterVersion:Int; //1..128 ASCII，version>=1
};
export type Param1 = {key:string; value:string | number | boolean};
export type Input1 = {
  role:'reference'|'mask'|'first-frame'|'last-frame'|'source-video'|'reference-audio';
  index:Int; //同role从0连续编号，保留用户实际顺序
  sha256:Hash;
  mime:'image/png'|'image/jpeg'|'image/webp'|'video/mp4'|'audio/wav';
  byteSize:Int; //>0，<=128MiB且不超过模型限制
};
export type EffectiveRequest1 = {
  version:1|2|3|4; videoInput?:{version:1|2;originalText:string;studioMode:'BASE'|'A'|'B'|'C';studio:null|{sourceJson:string;sourceSha256:string;automaticText:string;adoptedText:string};references?:{referenceId:string;assetId:string|null;origin:'local-import'|'library-reference'|'studio-snapshot';category:'character'|'product'|'scene'|'style';name:string;purpose:'reference_image'}[];reference?:null|{referenceId:string;assetId:string|null;origin:'local-import'|'library-reference'|'studio-snapshot';category:'character'|'product'|'scene'|'style';name:string;purpose:'reference_image'}}; references?:{referenceId:string;assetId:string|null;origin:'local-import'|'library-reference'|'studio-snapshot';category:'character'|'product'|'scene'|'style';name:string}[]; studio?:{version:1|2|3;group:'BASE'|'A'|'B'|'C';sourceJson:string;sourceSha256:string;originalText:string;automaticText:string;manualText:string}; target:Target1; operation:Operation;
  prompt:string; //1..131072 UTF-8字节，模型更严限制优先
  inputs:Input1[]; //<=64，实际模式／模型更严限制优先
  parameters:Param1[]; //<=32，无重复key，按ASCII key升序
  outputCount:Int | null; //1..64；接口不能保证精确n时null
};
export type Request1 = {
  requestId:string; attemptId:string; taskId:string; createdAt:Int;
  executionMode:'offline'|'provider';
  effective:EffectiveRequest1;
  digest:{version:1; algorithm:'sha256-jcs-rfc8785'; value:Hash};
};

export type ImageDetail1 = {
  kind:'image'; width:Int; height:Int; //1..32768且像素<=268435456
};
export type VideoDetail1 = {
  kind:'video'; container:'mp4';
  width:Int | null; height:Int | null;
  durationMs:Int | null; //有值1..3600000，解码器实测，非供方整数约值
  codec:'h264'|'hevc'|'av1'|'unknown';
  frameRate:{numerator:Int;denominator:Int} | null;
  audio:'present'|'absent'|'unknown';
};
export type Bytes1 = {
  mediaId:MediaId; sha256:Hash; mime:'image/png'|'image/jpeg'|'image/webp'|'video/mp4';
  byteSize:Int; //1..134217728；本地单媒体128MiB，模型更严上限优先
  detail:ImageDetail1 | VideoDetail1;
};
export type Derivation1 = {
  inputMediaId:MediaId; outputMediaId:MediaId; toolVersion:string; //1..64 ASCII
  change:
    {kind:'resize';width:Int;height:Int;fit:'contain'|'cover'} |
    {kind:'crop';x:Int;y:Int;width:Int;height:Int} |
    {kind:'reencode';mime:'image/png'|'image/jpeg'|'image/webp'|'video/mp4'};
};

export type Source1 = {
  version:1;
  kind:'legacy-mock'|'offline-synthetic'|'user-imported'|'provider-returned'|'unknown';
  requestId:string | null;
  outputIndex:Int | null; //有请求时0..63、在请求输出内唯一
  observedAt:Int;
  responseDeclaredModel:string | null; //1..200 ASCII，不冒充已证实内部模型
  providerJobId:string | null; providerRequestId:string | null;
  providerOutputId:string | null; //各1..256 ASCII，仅适配器已判定非秘密的定位符
  acquiredBy:'offline-generator'|'user-file'|'https-response'|'https-download'|
    'legacy-record'|'unknown';
  evidence:'trusted-execution'|'historical-marker'|'user-action'|'none';
  limitations:('model-not-returned'|'upstream-model-unverified'|
    'provider-defaults-unknown'|'history-incomplete'|'no-provider-signature'|
    'account-identity-unverified')[]; //去重，按此枚举顺序
};
export type Result1 = {
  resultId:string; taskId:string; createdAt:Int; favorite:boolean;
  source:Source1;
  representation:'original'|'derived';
  original:Bytes1; current:Bytes1;
  derivation:Derivation1[];
};

export type Draft1 = {
  studioInput?:import('./daily-input').StudioInput;
  taskId:string;
  prompt:string; //可为空，UTF-8<=131072
  target:Target1 | null;
  operation:Operation;
  inputs:Input1[];
  retained:Input1[]; //保留但不发送；与inputs按(role,index,hash)不得重复
  parameters:Param1[]; outputCount:Int | null;
};
export type GeneratedWorkspace1 = {
  version:1;
  drafts:Draft1[]; //每task至多1，<=256
  requests:Request1[]; //<=256，唯一requestId和attemptId
  results:Result1[]; //<=1024，唯一resultId
};
//DTO5 = 原DTO4受审字段目录（不任意放宽）＋以下唯一业务扩展：
//dto.schemaVersion = 5
//dto.business.generated: GeneratedWorkspace1 （必填，可为空集合）
//dto.business.workspace其余原字段；dto.registries / dto.media结构沿原定义
//sourceEvidence继续由Repository加入，为原构建来源轴

export type SourceAdmission1 = {
  version:1; admissionId:string; //main UUID，UI只持有opaque candidateHandle
  owner:{libraryId:string; canonicalPath:string; taskId:string};
  requestId:string | null; resultId:string;
  immutableBundleSha256:Hash;
  phase:'verified'|'joined'|'committed';
  saveOperationId:string | null;
};
