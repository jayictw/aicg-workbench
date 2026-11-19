export function chooseVersionConfig<T extends {configId:string}>(list:T[],previous:string,historicalUnavailable:boolean){
 if(historicalUnavailable)return ''
 return list.some(x=>x.configId===previous)?previous:list[0]?.configId||''
}
export function unavailableTarget(target:{serviceId:string;requestedModel:string}|null|undefined,kind:'image'|'video'){
 return !!target&&(target.serviceId!=='ark-cn'||target.requestedModel!==(kind==='image'?'doubao-seedream-5-0-flash-260915':'doubao-seedance-2-5-260628'))
}
