const {uid}=require('./service.cjs');
async function seed(s,projectName=null){if(s.graph.nodes.length||s.commit)return;s.graph.name=projectName??'空白創作畫布';await s.save({operationId:uid('empty-project'),expectedRevision:s.graph.revision});}
module.exports={seed};
