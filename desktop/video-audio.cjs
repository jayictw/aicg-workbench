'use strict';
// Enable model audio for new requests; track presence is decided by the model.
// Historical false snapshots remain explicit. Never infer audio from prompt text.
function matches(meta,parameters){return typeof parameters?.generate_audio==='boolean'&&(parameters.generate_audio?[null,'aac'].includes(meta.audioCodec):meta.audioCodec===null);}
module.exports={matches};
