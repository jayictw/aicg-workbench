type Row=Record<string,any>;
export function deadlineRules(model?:string):{scope:string;task:string;execution:string;media:string};
export function utcTime(ms:unknown):string;
export function deadlineDetails(job:Row):{rules:ReturnType<typeof deadlineRules>;taskIdDeadline:string;draftDeadline:string;executionDeadline:string;mediaDeadline:string;mediaBasis:string;local:string;recovery:string};
export function mergeTaskHistory(jobs?:Row[],history?:Row[]):Row[];
export function searchTaskHistory(rows:Row[],query?:string,filter?:string,limit?:number):{total:number;items:Row[]};
export function relatedAttempts(rows:Row[],nodeId:string):string[];
