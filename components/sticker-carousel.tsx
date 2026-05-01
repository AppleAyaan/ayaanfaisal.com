'use client';

import {
  motion,
  useAnimationFrame,
  useMotionValue,
  AnimatePresence,
  LayoutGroup,
} from 'framer-motion';
import { useRef, useState, useEffect, useCallback, useMemo, memo, Fragment } from 'react';
import { createPortal } from 'react-dom';

const STICKER_W = 160;
const STICKER_H = 112;
const MIN_GAP = 12;
const BASE_SPACING = STICKER_W + MIN_GAP;

interface Sticker {
  id: number;
  label: string;
  description: string;
  src: string;
  alt: string;
  rotation: number;
}

interface DetachedSticker extends Sticker {
  x: number;
  y: number;
}

const STICKER_DATA: Omit<Sticker, 'rotation'>[] = [
  {
    id: 0,
    label: 'airpods',
    description: 'my personal music players 🎧',
    src: '/stickers/airpods.png',
    alt: 'AirPods sticker',
  },
  {
    id: 1,
    label: 'drake',
    description: 'my 🐐 artist',
    src: '/stickers/drake.png',
    alt: 'Drake sticker',
  },
  {
    id: 2,
    label: 'mycar',
    description: 'my personal car 🚗',
    src: '/stickers/mycar.png',
    alt: 'My car sticker',
  },
  {
    id: 3,
    label: 'mymac',
    description: 'my coding machine 💻',
    src: '/stickers/mymac.png',
    alt: 'My Mac sticker',
  },
  {
    id: 4,
    label: 'cursor',
    description: 'my partner in crime 🤝',
    src: '/stickers/cursor.png',
    alt: 'Cursor sticker',
  },
  {
    id: 5,
    label: 'ovo',
    description: 'my keychain 🔑',
    src: '/stickers/ovo.png',
    alt: 'OVO sticker',
  },
  {
    id: 6,
    label: 'pocket3',
    description: 'dream camera! 📸',
    src: '/stickers/pocket3.png',
    alt: 'Pocket 3 sticker',
  },
  {
    id: 7,
    label: 'pakistan',
    description: 'ethnicity',
    src: '/stickers/pakistan.png',
    alt: 'Pakistan sticker',
  },
  {
    id: 8,
    label: 'uae',
    description: 'where I grew up 🇦🇪',
    src: '/stickers/uae.svg',
    alt: 'UAE sticker',
  },
];

const STICKERS: Sticker[] = STICKER_DATA.map((s, idx) => ({
  ...s,
  rotation: ((idx * 7) % 11) - 5,
}));
const INITIAL_STICKER_ORDER = [0, 1, 2, 3, 4, 8, 5, 6, 7];

const STICKER_BY_ID = new Map(STICKERS.map((s) => [s.id, s] as const));
const stickerById = (id: number) => STICKER_BY_ID.get(id);

export default function StickerCarousel() {
  const [stickerOrder, setStickerOrder] = useState<number[]>(
    INITIAL_STICKER_ORDER
  );
  const [detachedStickers, setDetachedStickers] = useState<DetachedSticker[]>(
    []
  );
  const [activeDragId, setActiveDragId] = useState<number | null>(null);
  const [isHoveringCarousel, setIsHoveringCarousel] = useState(false);
  const [isOverCarousel, setIsOverCarousel] = useState(false);
  const [insertionIndex, setInsertionIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fast Refresh can preserve state from an older sticker dataset.
  // Drop stale IDs so runtime rendering never sees undefined stickers.
  useEffect(() => {
    const validIds = new Set(STICKERS.map((s) => s.id));
    setStickerOrder((prev) => prev.filter((id) => validIds.has(id)));
    setDetachedStickers((prev) =>
      prev
        .filter((s) => validIds.has(s.id))
        .map((s) => {
          const fresh = stickerById(s.id);
          return fresh ? { ...fresh, x: s.x, y: s.y } : s;
        })
    );
  }, []);

  const carouselRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const trackWidthRef = useRef(0);
  const [spacing, setSpacing] = useState(BASE_SPACING);
  const hasInitializedStartPosRef = useRef(false);

  // Motion values that drive the actively-dragged sticker's position.
  // Updating these does NOT trigger a React re-render — framer-motion
  // applies them directly via transform on the next frame, which is
  // critical for smooth dragging at high refresh rates.
  const activeDragX = useMotionValue(0);
  const activeDragY = useMotionValue(0);

  // Mutable refs read by document-level pointer handlers
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const activeDragIdRef = useRef<number | null>(null);
  const isOverCarouselRef = useRef(false);
  const insertionIndexRef = useRef<number | null>(null);
  const stickerOrderRef = useRef<number[]>(stickerOrder);
  // Latest position of the active drag in PAGE coords — written by
  // pointermove, read on pointerup to commit the final resting place.
  const activeDragPosRef = useRef({ x: 0, y: 0 });

  activeDragIdRef.current = activeDragId;
  isOverCarouselRef.current = isOverCarousel;
  insertionIndexRef.current = insertionIndex;
  stickerOrderRef.current = stickerOrder;

  // Stable references so memoized children don't re-render unnecessarily
  const carouselStickers = useMemo(
    () =>
      stickerOrder
        .map(stickerById)
        .filter((sticker): sticker is Sticker => Boolean(sticker)),
    [stickerOrder]
  );
  const conveyorStickers = useMemo(
    () =>
      carouselStickers.length > 1
        ? [...carouselStickers, ...carouselStickers]
        : carouselStickers,
    [carouselStickers]
  );
  const isDragging = activeDragId !== null;

  useEffect(() => {
    const measureAndSetSpacing = () => {
      const carouselWidth = carouselRef.current?.getBoundingClientRect().width ?? 0;
      if (carouselStickers.length <= 1 || carouselWidth <= 0) {
        setSpacing(BASE_SPACING);
        return;
      }
      // Keep stickers tightly packed instead of stretching across the belt.
      setSpacing(BASE_SPACING);
    };

    measureAndSetSpacing();
    window.addEventListener('resize', measureAndSetSpacing);
    return () => window.removeEventListener('resize', measureAndSetSpacing);
  }, [carouselStickers.length]);

  useEffect(() => {
    trackWidthRef.current = stickerOrder.length * spacing;
  }, [stickerOrder.length, spacing]);

  useEffect(() => {
    if (hasInitializedStartPosRef.current) return;
    if (carouselStickers.length === 0) return;
    const carouselWidth = carouselRef.current?.getBoundingClientRect().width ?? 0;
    if (carouselWidth <= 0) return;

    const visibleTrackWidth = carouselStickers.length * spacing;
    const centeredStartX = (carouselWidth - visibleTrackWidth) / 2;
    x.set(centeredStartX);
    hasInitializedStartPosRef.current = true;
  }, [carouselStickers.length, spacing, x]);

  // Pause when hovering OR dragging
  useAnimationFrame((_, delta) => {
    if (isDragging || isHoveringCarousel) return;
    if (carouselStickers.length === 0) return;
    const speed = 50;
    const moveBy = (speed * delta) / 1000;
    let next = x.get() - moveBy;
    if (carouselStickers.length === 1) {
      const carouselWidth = carouselRef.current?.getBoundingClientRect().width ?? 0;
      if (next <= -spacing) {
        next = carouselWidth;
      }
      x.set(next);
      return;
    }

    // Seamless loop: no state reordering during motion, so no hitch/pause.
    if (trackWidthRef.current > 0 && next <= -trackWidthRef.current) {
      next += trackWidthRef.current;
    }
    x.set(next);
  });

  // Global pointer tracking — runs whenever a sticker is being dragged
  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      const id = activeDragIdRef.current;
      if (id === null) return;
      const offset = dragOffsetRef.current;
      // Sticker top-left in viewport coords (used for hit-testing)
      const stickerViewportX = e.clientX - offset.x;
      const stickerViewportY = e.clientY - offset.y;
      // Stored position is in PAGE coords so the sticker stays
      // glued to the page when the user scrolls
      const newX = stickerViewportX + window.scrollX;
      const newY = stickerViewportY + window.scrollY;

      // Drive the dragged sticker via motion values — no React re-render.
      activeDragX.set(newX);
      activeDragY.set(newY);
      activeDragPosRef.current.x = newX;
      activeDragPosRef.current.y = newY;

      // Check whether cursor is over carousel area (viewport coords)
      if (carouselRef.current && trackRef.current) {
        const carRect = carouselRef.current.getBoundingClientRect();
        const overCarousel =
          e.clientX >= carRect.left &&
          e.clientX <= carRect.right &&
          e.clientY >= carRect.top &&
          e.clientY <= carRect.bottom;

        // Avoid redundant setStates when the value hasn't actually changed.
        if (overCarousel !== isOverCarouselRef.current) {
          setIsOverCarousel(overCarousel);
          setIsHoveringCarousel(overCarousel);
        }

        if (overCarousel) {
          const trackRect = trackRef.current.getBoundingClientRect();
          // Use the CENTER of the dragged sticker for slot calculation
          // (viewport coords on both sides of the subtraction)
          const stickerCenterX = stickerViewportX + STICKER_W / 2;
          const relX = stickerCenterX - trackRect.left;
          const trackLen = stickerOrderRef.current.length;
          let nextIdx: number;
          if (trackLen > 0 && trackWidthRef.current > 0) {
            const localPos =
              ((relX % trackWidthRef.current) + trackWidthRef.current) %
              trackWidthRef.current;
            nextIdx = Math.max(
              0,
              Math.min(trackLen, Math.round(localPos / spacing))
            );
          } else {
            nextIdx = 0;
          }
          if (nextIdx !== insertionIndexRef.current) {
            setInsertionIndex(nextIdx);
          }
        } else if (insertionIndexRef.current !== null) {
          setInsertionIndex(null);
        }
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      const id = activeDragIdRef.current;
      if (id === null) return;
      const wasOverCarousel = isOverCarouselRef.current;
      const targetIdx = insertionIndexRef.current;

      if (wasOverCarousel && targetIdx !== null) {
        // Slot back into carousel
        setStickerOrder((prev) => {
          const filtered = prev.filter((sid) => sid !== id);
          filtered.splice(Math.min(targetIdx, filtered.length), 0, id);
          return filtered;
        });
        setDetachedStickers((prev) => prev.filter((s) => s.id !== id));
      } else {
        // Commit the final dragged position back into state in ONE update.
        // Also check whether the sticker landed on a no-drop zone
        // (e.g. the sticky left navbar) and shove it past the right edge.
        let finalX = activeDragPosRef.current.x;
        const finalY = activeDragPosRef.current.y;

        const offset = dragOffsetRef.current;
        const stickerLeft = e.clientX - offset.x;
        const stickerTop = e.clientY - offset.y;
        const centerX = stickerLeft + STICKER_W / 2;
        const centerY = stickerTop + STICKER_H / 2;

        const elements = document.elementsFromPoint(centerX, centerY);
        const zone = elements
          .map((el) =>
            (el as HTMLElement).closest?.('[data-sticker-no-drop="true"]')
          )
          .find(Boolean) as HTMLElement | undefined;

        if (zone) {
          const zRect = zone.getBoundingClientRect();
          const padding = 12;
          finalX = zRect.right + padding + window.scrollX;
        }

        setDetachedStickers((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, x: finalX, y: finalY } : s
          )
        );
      }

      // Reset hover state based on actual cursor position so the
      // carousel resumes scrolling if the user dropped outside it
      let cursorStillOverCarousel = false;
      if (carouselRef.current) {
        const carRect = carouselRef.current.getBoundingClientRect();
        cursorStillOverCarousel =
          e.clientX >= carRect.left &&
          e.clientX <= carRect.right &&
          e.clientY >= carRect.top &&
          e.clientY <= carRect.bottom;
      }
      setIsHoveringCarousel(cursorStillOverCarousel);

      setActiveDragId(null);
      setIsOverCarousel(false);
      setInsertionIndex(null);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isDragging]);

  // Pickup from carousel — detach + start drag in one motion
  const handleCarouselPickup = useCallback(
    (sticker: Sticker, event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const rect = event.currentTarget.getBoundingClientRect();
      dragOffsetRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };

      // Convert viewport coords to PAGE coords so the sticker
      // sticks to the document and scrolls with it
      const pageX = rect.left + window.scrollX;
      const pageY = rect.top + window.scrollY;

      // Seed the motion values BEFORE switching activeDragId so the
      // active sticker mounts at the correct position (no flicker).
      activeDragX.set(pageX);
      activeDragY.set(pageY);
      activeDragPosRef.current = { x: pageX, y: pageY };

      setStickerOrder((prev) => prev.filter((id) => id !== sticker.id));
      setDetachedStickers((prev) => [
        ...prev.filter((s) => s.id !== sticker.id),
        { ...sticker, x: pageX, y: pageY },
      ]);
      setActiveDragId(sticker.id);
    },
    [activeDragX, activeDragY]
  );

  // Pickup of an already-detached sticker for re-dragging
  const handleDetachedPickup = useCallback(
    (sticker: DetachedSticker, event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const rect = event.currentTarget.getBoundingClientRect();
      dragOffsetRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      // Seed motion values from the sticker's current resting position
      activeDragX.set(sticker.x);
      activeDragY.set(sticker.y);
      activeDragPosRef.current = { x: sticker.x, y: sticker.y };
      setActiveDragId(sticker.id);
    },
    [activeDragX, activeDragY]
  );

  const handleCleanup = () => {
    setDetachedStickers([]);
    setStickerOrder(INITIAL_STICKER_ORDER);
  };

  const showInsertionPreview =
    isDragging && isOverCarousel && insertionIndex !== null;

  return (
    <>
      <div
        ref={carouselRef}
        onMouseEnter={() => setIsHoveringCarousel(true)}
        onMouseLeave={() => setIsHoveringCarousel(false)}
        className="relative w-full bg-background border-t border-border/30 overflow-hidden py-8"
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />

        {carouselStickers.length === 0 && !isDragging ? (
          <div className="flex items-center justify-center h-32">
            <button
              onClick={handleCleanup}
              className="px-6 py-3 rounded-full font-semibold shadow-md bg-sky-200 text-sky-900 hover:bg-sky-300 hover:scale-105 transition-transform transition-colors"
            >
              clean up
            </button>
          </div>
        ) : (
          <motion.div
            ref={trackRef}
            className="flex will-change-transform"
            style={{ x, gap: `${Math.max(0, spacing - STICKER_W)}px` }}
          >
            <LayoutGroup>
              {conveyorStickers.map((sticker, idx) => {
                const localIndex = idx % Math.max(carouselStickers.length, 1);
                const showSpacerHere =
                  showInsertionPreview && localIndex === insertionIndex;
                return (
                  <Fragment key={`${sticker.id}-${idx}`}>
                    {showSpacerHere && (
                      <motion.div
                        key={`spacer-${idx}`}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{
                          type: 'spring',
                          stiffness: 320,
                          damping: 26,
                        }}
                        className="flex-shrink-0 rounded-xl border-2 border-dashed border-foreground/30 bg-foreground/5"
                        style={{ width: STICKER_W, height: STICKER_H }}
                      />
                    )}
                    <motion.div
                      layout
                      transition={{
                        type: 'spring',
                        stiffness: 320,
                        damping: 26,
                      }}
                    >
                      <CarouselSticker
                        sticker={sticker}
                        onPickup={handleCarouselPickup}
                      />
                    </motion.div>
                  </Fragment>
                );
              })}
              {showInsertionPreview &&
                insertionIndex === carouselStickers.length && (
                  <motion.div
                    key="spacer-end"
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                    className="flex-shrink-0 rounded-xl border-2 border-dashed border-foreground/30 bg-foreground/5"
                    style={{ width: STICKER_W, height: STICKER_H }}
                  />
                )}
            </LayoutGroup>
          </motion.div>
        )}
      </div>

      {/* Detached stickers — rendered into <body> via portal so they
          can be position: absolute with PAGE coordinates and stick
          to the document like real stickers (scroll with the page) */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {detachedStickers.map((sticker) => {
              const isActive = activeDragId === sticker.id;
              // Active sticker's position is driven by motion values
              // (no React re-render per pointermove). Inactive stickers
              // use static `left`/`top` from state — only updates when
              // they change ownership of "active" status.
              const positionStyle = isActive
                ? { x: activeDragX, y: activeDragY, left: 0, top: 0 }
                : { left: sticker.x, top: sticker.y };
              return (
                <motion.div
                  key={sticker.id}
                  onPointerDown={(e) => handleDetachedPickup(sticker, e)}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{
                    scale: isActive ? 1.08 : 1,
                    opacity: 1,
                  }}
                  exit={{
                    scale: 0.5,
                    opacity: 0,
                    transition: { duration: 0.2 },
                  }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  style={{
                    position: 'absolute',
                    ...positionStyle,
                    rotate: sticker.rotation,
                    width: STICKER_W,
                    height: STICKER_H,
                    zIndex: isActive ? 1000 : 100,
                    cursor: isActive ? 'grabbing' : 'grab',
                    touchAction: 'none',
                    willChange: isActive ? 'transform' : undefined,
                  }}
                  className="select-none"
                >
                  <img
                    src={sticker.src}
                    alt={sticker.alt}
                    draggable={false}
                    className="h-full w-full object-contain pointer-events-none"
                    style={{
                      filter:
                        'drop-shadow(2px 0 0 #fff) drop-shadow(-2px 0 0 #fff) drop-shadow(0 2px 0 #fff) drop-shadow(0 -2px 0 #fff) drop-shadow(0 10px 14px rgba(0,0,0,0.35))',
                    }}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}

interface CarouselStickerProps {
  sticker: Sticker;
  onPickup: (sticker: Sticker, e: React.PointerEvent<HTMLDivElement>) => void;
}

// Memoized so re-renders of the parent (which happen on drag/hover state
// changes) don't reconcile all 24 stickers when nothing about them has
// actually changed. `onPickup` is stable via useCallback in the parent.
const CarouselSticker = memo(function CarouselSticker({
  sticker,
  onPickup,
}: CarouselStickerProps) {
  return (
    <div
      onPointerDown={(e) => onPickup(sticker, e)}
      style={{
        transform: `rotate(${sticker.rotation}deg)`,
        width: STICKER_W,
        height: STICKER_H,
        touchAction: 'none',
      }}
      className="group relative flex-shrink-0 cursor-grab active:cursor-grabbing select-none transition-transform hover:scale-105"
    >
      <img
        src={sticker.src}
        alt={sticker.alt}
        draggable={false}
        className="h-full w-full object-contain pointer-events-none"
        style={{
          filter:
            'drop-shadow(2px 0 0 #fff) drop-shadow(-2px 0 0 #fff) drop-shadow(0 2px 0 #fff) drop-shadow(0 -2px 0 #fff) drop-shadow(0 8px 12px rgba(0,0,0,0.3))',
        }}
      />
      <p className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap text-[11px] text-muted-foreground/70 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {sticker.description}
      </p>
    </div>
  );
});
