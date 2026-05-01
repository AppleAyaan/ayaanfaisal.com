'use client';

import { useEffect, useState } from 'react';

export default function HoverName() {
  const [hovered, setHovered] = useState(false);
  const [coarsePointer, setCoarsePointer] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const sync = () => setCoarsePointer(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return (
    <button
      type="button"
      aria-label="Ayaan Faisal name"
      aria-pressed={hovered}
      onMouseEnter={() => {
        if (!coarsePointer) setHovered(true);
      }}
      onMouseLeave={() => {
        if (!coarsePointer) setHovered(false);
      }}
      onClick={() => {
        if (coarsePointer) setHovered((v) => !v);
      }}
      className="group relative inline-block cursor-pointer touch-manipulation select-none p-0 bg-transparent border-0 text-left overflow-hidden"
      style={{
        width: 'min(820px, 100%)',
        aspectRatio: '1000 / 300',
        maxWidth: '100%',
        marginLeft: 0,
      }}
    >
      <span className="sr-only">Ayaan Faisal</span>

      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center select-none pointer-events-none transition-opacity duration-300 ease-out"
        style={{
          opacity: hovered ? 0 : 1,
          padding: 'clamp(6px, 0.8vw, 14px)',
        }}
      >
        <img
          src="/images/ayaan-faisal-eng.svg"
          alt=""
          className="block w-full h-full"
          style={{
            objectFit: 'contain',
            objectPosition: 'center center',
            transform: 'scaleX(1) scaleY(1.02)',
            transformOrigin: 'center center',
          }}
        />
      </div>

      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center select-none pointer-events-none transition-opacity duration-300 ease-out"
        style={{
          opacity: hovered ? 1 : 0,
          padding: 'clamp(6px, 0.8vw, 14px)',
        }}
      >
        <img
          src="/images/ayaan-faisal-urdu.svg"
          alt=""
          className="block w-full h-full"
          style={{
            objectFit: 'contain',
            objectPosition: 'center center',
            direction: 'rtl',
            transform: 'scaleX(1.02) scaleY(1.02)',
            transformOrigin: 'center center',
            fontFamily: '"Noto Naskh Arabic", "Amiri", "Scheherazade", serif',
          }}
        />
      </div>
    </button>
  );
}
