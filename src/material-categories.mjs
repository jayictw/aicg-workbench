export const materialCategories=[{id:'all',label:'全部'},{id:'character',label:'人物'},{id:'product',label:'產品'},{id:'scene',label:'場景'},{id:'generic',label:'未分類'},{id:'style',label:'風格'},{id:'studio',label:'攝影棚'},{id:'reference',label:'參考'}];
export function filterMaterials(rows,category='all',query=''){
 const needle=query.trim().toLocaleLowerCase();
 return rows.filter(a=>(category==='all'||(a.classifications??['generic']).includes(category))&&(!needle||a.name.toLocaleLowerCase().includes(needle)));
}
