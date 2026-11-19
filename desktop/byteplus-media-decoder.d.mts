import type {MediaDecoder} from './byteplus-media-transport.mjs';
/** Executable paths are trusted host configuration, with mandatory byte SHA pins. */
export function createBytePlusMediaDecoder(options:{ffmpegPath:string;ffprobePath:string;ffmpegSha256:string;ffprobeSha256:string;timeoutMs?:number}):MediaDecoder;
