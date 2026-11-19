import {ui,useUiLocale,uiDetails,sanitizeUiDetails,uiFeedback} from '../shared/ui-locale.mjs';
import React,{useEffect,useRef,useState} from 'react';
type Any=Record<string,any>;
export function AddAiModel({form,snapshot,patch,save,saving,full,onError}:{form:Any,snapshot:Any,patch:(p:Any)=>void,save:()=>void,saving:boolean,full:()=>void,onError:(e:Any)=>void}){useUiLocale(React);
 const [platform,setPlatform]=useState(''),[variables,setVariables]=useState<Any>({}),[resolved,setResolved]=useState<Any|null>(null),[pending,setPending]=useState(false),serial=useRef(0),[advanced,setAdvanced]=useState(false);
 useEffect(()=>()=>{serial.current++;},[]);
 const [discovering,setDiscovering]=useState(false),[checkpoints,setCheckpoints]=useState<{address:string;titles:string[];error:string}|null>(null);
 const currentCheckpoints=checkpoints?.address===form.baseUrl?checkpoints:null;
 const t=snapshot.platforms.find((t:Any)=>t.id===platform),missing=(t?.required??[]).filter((k:string)=>!variables[k]);
 async function apply(id:string,v:Any,platformChange=false){const token=++serial.current;setPending(true);try{const r=await window.canvasAPI.apiUiTemplate({platformId:id,variables:v,connectionCount:snapshot.config.connections.length+snapshot.localDrafts.length});if(!r.ok)throw r.error;if(token!==serial.current)return;setResolved(r.value);const p=r.value.patch;if(!platformChange){delete p.connectionName;delete p.mediaKind;delete p.templateId;}patch(p);}catch(e:any){if(token===serial.current){setResolved(null);onError(e);}}finally{if(token===serial.current)setPending(false);}}
 async function discoverLocal(){
  const address=form.baseUrl;setDiscovering(true);setCheckpoints(null);
  try{const r=await window.canvasAPI.apiUiSdCheckpoints({baseUrl:address});if(!r.ok)throw r.error;setCheckpoints({address,titles:r.value,error:'' });}
  catch(e:any){setCheckpoints({address,titles:[],error:e.code??'SD_LOCAL_SERVICE_UNAVAILABLE'});}
  finally{setDiscovering(false);}
 }
 function pick(id:string){serial.current++;setPending(false);setPlatform(id);setVariables({});setResolved(null);if(id)apply(id,{},true);}
 function variable(k:string,v:string){const next={...variables,[k]:v};setVariables(next);apply(platform,next);}
 const input=(label:string,k:string,props:Any={})=><label className="api-field">{ui(label)}<input aria-label={ui(label)} value={form[k]} onChange={e=>patch({[k]:e.target.value,...(k==='wireId'&&platform.startsWith('BP.')?{selectorKind:e.target.value.startsWith('ep-')?'ENDPOINT_ID':'MODEL_ID'}:{})})} maxLength={2048} {...props} placeholder={props.placeholder?ui(props.placeholder):undefined}/></label>;
 const knownModel=t?.modelReferences.find((m:Any)=>m.canonical_model_or_route===form.wireId);
 const wanReady=platform==='A.V'&&Object.values(snapshot.routeCapabilities??{}).some((m:any)=>Object.values(m).some((c:any)=>c.id==='WAN3_'+form.wireId));
 const xaiReady=['X.I','X.V'].includes(platform)&&Object.hasOwn(snapshot.xaiModels??{},form.wireId)&&snapshot.xaiModels[form.wireId].mediaKind===(platform==='X.I'?'IMAGE':'VIDEO');
 const bflReady=platform==='B.'+form.wireId&&t?.path==='/v1/'+form.wireId&&Object.hasOwn(snapshot.bflModels??{},form.wireId)&&snapshot.bflModels[form.wireId].mediaKind===form.mediaKind;
 const minimaxReady=platform.startsWith('M.')&&Object.hasOwn(snapshot.minimaxModels??{},form.wireId)&&snapshot.minimaxModels[form.wireId].mediaKind===form.mediaKind;
 const klingReady=platform==='K'&&Object.hasOwn(snapshot.klingModels??{},form.wireId)&&snapshot.klingModels[form.wireId].mediaKind===form.mediaKind;
 const adapterReady=platform==='R'&&snapshot.runwayModels?.includes(form.wireId);
 return <section className="api-onboarding" aria-label={ui("简易模型接入")}>
  <h3>{ui("把你的 AI 模型加入画布")}</h3><p>{ui("选择服务平台，填入调用标识，即可保存配置。")}</p>
  <label className="api-field">{ui("API 服务平台")}<select aria-label={ui("API 服务平台")} value={platform} onChange={e=>pick(e.target.value)}><option value="">{ui("请选择平台…")}</option>{[['官方平台',snapshot.platforms.filter((x:Any)=>x.kind==='ORIGINAL')],['第三方平台',snapshot.platforms.filter((x:Any)=>x.kind==='THIRD_PARTY')],['本地平台',snapshot.platforms.filter((x:Any)=>x.id==='SD_LOCAL')]].map(([name,items]:any)=><optgroup key={name} label={ui(name)}>{items.map((x:Any)=><option key={x.id} value={x.id}>{ui(x.label)}</option>)}</optgroup>)}</select></label>
  <aside className="api-note" aria-label={ui("后续版本支持")}><b>{ui("后续版本支持")}</b><p>{ui("未知第三方或本地服务可在「自定义与本地连接」保存草稿。真实调用需要对应的协议适配。")}</p><details><summary>{ui("查看暂未开放平台")}</summary><ul>{snapshot.unavailablePlatforms.filter((x:Any)=>!["CUSTOM","LOCAL"].includes(x.id)).map((x:Any)=><li key={x.id}>{ui(x.label)}：{ui(x.reason)}</li>)}</ul></details></aside>
  {platform&&<>
   {input('模型 ID 或 Endpoint ID','wireId',{placeholder:platform==='SD_LOCAL'?'填写 WebUI 模型清单中的完整标题':'粘贴平台提供的原始标识，不会自动改写'})}
   {platform==='SD_LOCAL'&&<>{input('Base URL','baseUrl')}
    <button type="button" disabled={discovering||!form.baseUrl} onClick={discoverLocal}>{ui(discovering?'正在读取本机模型…':'读取本机模型')}</button>
    {currentCheckpoints&&(currentCheckpoints.error?<div role="alert">{uiFeedback(React,currentCheckpoints.error,true)}</div>:currentCheckpoints.titles.length?<label className="api-field">{ui('已安装的模型')}<select value="" onChange={e=>{if(e.target.value)patch({wireId:e.target.value});}}><option value="">{ui('选择本机模型…')}</option>{currentCheckpoints.titles.map(title=><option key={title} value={title}>{title}</option>)}</select></label>:<p role="status">{ui('服务已连接，但没有可选择的模型。')}</p>)}
    <p className="api-note">{ui('只读取模型名称。生成前仍需确认。')}</p>
    <p className="api-note">{ui('仅支持同机 Stable Diffusion WebUI 文生图。服务须已开启 API 并返回 PNG；首次确认时核对已安装的模型。')}</p></>}
   {platform.startsWith('BP.')&&<label className="api-field">{ui("标识类型")}<select aria-label={ui("标识类型")} value={form.selectorKind} onChange={e=>patch({selectorKind:e.target.value})}><option value="MODEL_ID">{ui("模型 ID")}</option><option value="ENDPOINT_ID">Endpoint ID</option></select></label>}
   {t?.mediaKinds.length>1&&<label className="api-field">{ui("用于创作")}<select aria-label={ui("用于创作")} value={form.mediaKind} onChange={e=>patch({mediaKind:e.target.value,templateId:'UNKNOWN',...(t.pathsByMediaKind?{path:t.pathsByMediaKind[e.target.value]}:{})})}><option value="VIDEO">{ui("视频")}</option><option value="IMAGE">{ui("图片")}</option></select></label>}
   {t?.required.includes('workspace')&&<label className="api-field">{ui("Workspace ID（业务空间ID）")}<input aria-label={ui("Workspace ID（业务空间ID）")} value={variables.workspace??''} onChange={e=>variable('workspace',e.target.value)} placeholder={ui("平台提供的 WorkspaceId")}/></label>}
   {(t?.required.includes('region')||platform==='B')&&<label className="api-field">{ui("服务地区")}<select aria-label={ui("服务地区")} value={variables.region??(platform==='B'?'global':'')} onChange={e=>variable('region',e.target.value)}><option value="">{ui("请选择平台开通的地区…")}</option>{t.regionOptions.map((v:string)=><option key={v} value={v}>{v}</option>)}</select><small>{ui("按平台账户选择；列出的地区不保证你的模型或账户已开通。")}</small></label>}
   {t?.authType!=='NONE'&&<p className="api-note">{ui("保存模型后，在上方「本机凭据管理」打开独立窗口输入 Key。凭据不进入模型配置；真实连接尚未验证。")}</p>}
   <p className="api-note" role="note">{platform==='SD_LOCAL' ? ui('协议已适配；保存不联网。生成前仍需确认，真实模型未经验证。') : bflReady ? ui("BFL 精确协议已适配；Video 仅 t2v Preview。账户和地域权限未验证，真实联网 BLOCK。") : minimaxReady ? ui("MiniMax 官方协议已适配；账户资格与真实API未验证。模式按区域和模型能力显示；音讯开关与第五模式提交未开放。") : klingReady ? ui("Kling 3.0 本批协议已适配；真实 API 与账户权限未验证。只支持本批图片与前三种影片模式；第五模式 UI 留待 P2-01。") : xaiReady ? ui("xAI 本批协议已适配；真实 API 与账户权限未验证。模式按模型能力显示，第五模式 UI 留待 P2-01。") : wanReady ? ui("Wan 3.0 本批协议已适配；真实 API 与账户权限未验证。支持前四种现有模式；第五模式 UI 留待 P2-01。") : adapterReady ? ui("Runway 本批协议已适配；真实 API 与账户权限未验证。支持模式以画布所示能力为准。") : ui("保存不联网、不扣费。配置可加入画布，但真实调用尚未适配。能力：UNKNOWN（未确认）。")}</p>
   {(!adapterReady&&!wanReady&&!xaiReady&&!klingReady&&!minimaxReady&&!bflReady&&t?.admission?.scope&&<p className="api-note" role="note">{ui(t.admission.scope)}</p>)}
   {t?.evidence==='OFFICIAL_DOCS_RESEARCH_ONLY'&&<details><summary>{ui("平台接入参考 ·")+" "}{t.checkedDate}</summary><p>{ui("根据已收集的官方文档带入连接参数。文档研究不代表账户权限或真实连接成功。")}</p><p>{bflReady ? ui("BFL 精确协议已适配；Video 仅 t2v Preview。账户和地域权限未验证，真实联网 BLOCK。") : minimaxReady ? ui("MiniMax 官方协议已适配；账户资格与真实API未验证。模式按区域和模型能力显示；音讯开关与第五模式提交未开放。") : klingReady ? ui("Kling 3.0 本批协议已适配；真实 API 与账户权限未验证。只支持本批图片与前三种影片模式；第五模式 UI 留待 P2-01。") : xaiReady ? ui("所选 xAI 模型协议已适配；真实 API 与账户权限未验证。图片采用同步单输出，视频按原 request_id 恢复。") : wanReady ? ui("所选 Wan 3.0 协议已适配，真实 API 与账户权限未验证；第五模式 UI 留待 P2-01。") : adapterReady ? ui("本批已适配所选 Runway 模型；平台模板原件和历史研究记录保留。") : t.notes}</p><ul>{t.sources.map((x:Any)=><li key={x.id}><span>{x.id} · {ui(x.access)}</span> <code>{x.url}</code></li>)}</ul>{knownModel&&<><h4>{ui("该模型的文档参考")}</h4><p>{ui("仅作参考；真实调用与参数组合仍未验证。")}</p><pre>{sanitizeUiDetails(knownModel)}</pre></>}</details>}
   <details open={advanced} onToggle={e=>setAdvanced(e.currentTarget.open)} className="api-advanced"><summary>{ui("进阶设置")}</summary>
    {input('模型显示名称（可选）','modelName',{placeholder:'留空时使用原始模型标识'})}{input('连接名称','connectionName')}
    {platform!=='SD_LOCAL'&&input('平台地址（自动配置）','baseUrl',{readOnly:true})}
    {input('协议','protocolId',{readOnly:true})}{input('协议版本','protocolVersion',{readOnly:true})}{input('Region','region',{readOnly:true})}
    <label className="api-field">{ui("认证方式")}<select aria-label={ui("认证方式")} disabled value={form.authType} onChange={e=>patch({authType:e.target.value})}>{['NONE','BEARER','HEADER_KEY','OAUTH','AK_SK','UNKNOWN'].map(v=><option key={v} value={v}>{v}</option>)}</select></label>
    {input('请求路径（平台配置）','path',{readOnly:true})}<p>{ui("请求映射参考：")}{(t?.requestMapping??'UNKNOWN')}</p><p>{ui("连接参数由已核实模板自动配置，不能改成自定义地址或协议；模型标识原样保存。")}</p>
    <button onClick={full}>{ui("完整设置流程（七步）")}</button>
   </details>
   {missing.length>0&&<p role="status">{ui("请补充")}{missing.map((x:string)=>({workspace:'工作空间',region:'服务地区',project:'项目 ID'}[x])).join('、')}{ui("后再保存。")}</p>}
   <button className="primary" disabled={saving||pending||!resolved||missing.length>0||!form.baseUrl||!form.wireId.trim()} onClick={save}>{pending ? ui("正在带入配置…") : saving ? ui("正在保存…") : ui("保存模型")}</button>
  </>}
 </section>;
}
