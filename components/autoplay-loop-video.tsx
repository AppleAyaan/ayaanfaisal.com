'use client';

/**
 * Muted looping clips for previews. WebM first (smaller on Chrome/Firefox);
 * MP4 sibling required for Safari / iOS (WebM unsupported or flaky there).
 */

import type { VideoHTMLAttributes } from 'react';

type Props = {
  webmSrc: string;
  /** Defaults to sibling `*.mp4` next to each `*.webm` under /public */
  mp4Src?: string;
} & Omit<
  VideoHTMLAttributes<HTMLVideoElement>,
  'muted' | 'autoPlay' | 'loop' | 'playsInline' | 'children' | 'ref'
>;

export default function AutoplayLoopVideo({
  webmSrc,
  mp4Src = webmSrc.replace(/\.webm$/i, '.mp4'),
  className,
  preload = 'metadata',
  ...rest
}: Props) {
  return (
    <video
      className={className}
      preload={preload}
      autoPlay
      loop
      muted
      playsInline
      {...rest}
    >
      <source src={webmSrc} type="video/webm" />
      <source src={mp4Src} type="video/mp4" />
    </video>
  );
}
