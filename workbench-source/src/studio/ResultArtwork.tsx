import type { CSSProperties } from 'react'

// The frame demonstrates the requested ratio; the local illustration keeps its own proportions.
export function ResultArtwork({ src, ratio, alt }: { src: string; ratio: string; alt: string }) {
  return <div className="m2-artwork" data-ratio={ratio} style={{ '--m2-result-ratio': ratio.replace(':', ' / ') } as CSSProperties}>
    <img src={src} alt={alt} width="1000" height="600" loading="lazy" />
  </div>
}
