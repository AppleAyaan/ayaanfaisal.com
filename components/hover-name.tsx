'use client';

import { useState } from 'react';

export default function HoverName() {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      aria-label="Ayaan Faisal name"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative inline-block cursor-pointer p-0 bg-transparent border-0 text-left overflow-hidden"
      style={{
        width: 'clamp(250px, 52vw, 820px)',
        aspectRatio: '1000 / 300',
        maxWidth: '100%',
        marginLeft: 'clamp(-30px, -1.6vw, -12px)',
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
