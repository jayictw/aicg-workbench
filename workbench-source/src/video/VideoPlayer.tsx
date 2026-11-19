import { useEffect, useRef, useState } from 'react'
import { Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { pauseAllMedia } from '../management/AudioPreview'
import { sampleVideo } from './mock'
export const pauseStudioVideos = pauseAllMedia
export function VideoPlayer({ label, src = sampleVideo.src, example = true, mime = 'video/mp4', ratio, variant }: { label: string; src?: string; example?: boolean; mime?: string; ratio?: string; variant?: 'creative-ui-r2' }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState(''), [playing, setPlaying] = useState(false), [muted, setMuted] = useState(true), [time, setTime] = useState(0), [duration, setDuration] = useState(0)
  useEffect(() => { const video = ref.current; return () => { video?.pause() } }, [])
  const format = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
  async function togglePlay() {
    const video = ref.current!
    if (!video.paused) { video.pause(); return }
    pauseAllMedia()
    try { await video.play() } catch (e) { if (e instanceof DOMException && e.name === 'AbortError') return; setError('无法播放本地示例，请检查文件或浏览器媒体支持。') }
  }
  return <div className="v3-player" role="group" aria-label={label} data-player-state={variant ? error ? "error" : duration ? "ready" : "loading" : undefined} aria-busy={variant && !error && !duration ? true : undefined}>{variant && !error && !duration && <p className="ui-r2-player-loading" role="status">正在读取本机影片…</p>}{error && <p className={variant ? "ui-r2-player-alert" : undefined} role="alert">{error}</p>}<video ref={ref} data-studio-video muted playsInline preload="metadata" poster={example ? sampleVideo.poster : undefined} style={ratio ? { aspectRatio: ratio } : undefined} width={sampleVideo.width} height={sampleVideo.height} aria-label={label} onError={() => setError('示例影片加载失败，请检查本机示例文件；这不是生成失败。')} onLoadedMetadata={event => setDuration(event.currentTarget.duration)} onTimeUpdate={event => setTime(event.currentTarget.currentTime)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onVolumeChange={event => setMuted(event.currentTarget.muted)} onPlay={event => { setPlaying(true); const active = event.currentTarget; document.querySelectorAll<HTMLVideoElement>('video[data-studio-video]').forEach(video => { if (video !== active) video.pause() }) }}><source src={src} type={mime} />当前浏览器无法播放本地 MP4 示例。</video>
    <div className="v3-playback"><button className="m2-icon-button" aria-label={playing ? (example ? '暂停示例影片' : '暂停视频') : (example ? '播放示例影片' : '播放视频')} onClick={() => void togglePlay()}>{playing ? <Pause aria-hidden="true" size={16} /> : <Play aria-hidden="true" size={16} />}</button><input type="range" min="0" max={duration || sampleVideo.duration} step="0.01" value={Math.min(time, duration || sampleVideo.duration)} aria-label={example ? "示例影片播放位置" : "视频播放位置"} aria-valuetext={`${time.toFixed(1)} 秒 / ${duration.toFixed(1)} 秒`} disabled={!duration} onChange={event => { ref.current!.currentTime = Number(event.target.value); setTime(Number(event.target.value)) }} /><span>{format(time)} / {format(duration)}</span><button className="m2-icon-button" aria-label={muted ? (example ? '取消示例静音' : '取消视频静音') : (example ? '静音示例影片' : '静音视频')} aria-pressed={muted} onClick={() => { ref.current!.muted = !ref.current!.muted }}>{muted ? <VolumeX aria-hidden="true" size={16} /> : <Volume2 aria-hidden="true" size={16} />}</button></div>
  </div>
}
