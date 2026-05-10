'use client';

/**
 * Home page composition + interaction hub.
 * Edit here for: sidebar/nav links, music player UX, tag hover popups, sections/content layout.
 * Related files:
 * - app/music-tracks.ts (playlist data)
 * - components/sticker-carousel.tsx (sticker strip behavior)
 * - components/hover-name.tsx (name hover animation)
 */

import { Github, Linkedin, Mail, Instagram, SkipBack, SkipForward, Menu, X as MenuX, Heart, Sun, MoonStar } from 'lucide-react';
import { Fragment, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { motion, useMotionValue, useTransform, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import Script from 'next/script';
import StickerCarousel from '@/components/sticker-carousel';
import HoverName from '@/components/hover-name';
import AutoplayLoopVideo from '@/components/autoplay-loop-video';
import { musicTracks } from './music-tracks';
import { applyThemeWithEntranceReplay } from '@/lib/theme-transition';
import { useThemeEntranceReplay } from '@/components/theme-entrance-replay';

function HandDrawnUnderline({
  children,
  delay = 0,
  triggerOnView = false,
}: {
  children: ReactNode;
  delay?: number;
  triggerOnView?: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const underlineDone = { pathLength: 1 as const, opacity: 1 as const };
  const underlineStart = { pathLength: 0 as const, opacity: 0 as const };
  return (
    <span className="relative inline-block align-baseline">
      <span className="relative z-10">{children}</span>
      <motion.svg
        aria-hidden="true"
        viewBox="0 0 100 18"
        className="absolute left-0 right-0 -bottom-1 h-4 w-full overflow-visible"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M3 10.5C14 8.5 24 13 35 10.8C46 8.6 56 12.2 67 10.2C78 8.2 88 11.2 97 9.2"
          fill="none"
          stroke="#9fd0ea"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={prefersReducedMotion ? underlineDone : underlineStart}
          animate={
            prefersReducedMotion
              ? underlineDone
              : triggerOnView
                ? undefined
                : { pathLength: 1, opacity: 1 }
          }
          whileInView={
            triggerOnView && !prefersReducedMotion ? { pathLength: 1, opacity: 1 } : undefined
          }
          viewport={triggerOnView && !prefersReducedMotion ? { once: true, amount: 0.65 } : undefined}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 1.1, ease: [0.22, 1, 0.36, 1], delay }
          }
        />
      </motion.svg>
    </span>
  );
}

function FlipbookTitle({
  text,
  delay = 0,
}: {
  text: string;
  delay?: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [displayText, setDisplayText] = useState(' '.repeat(text.length));
  const [hasStarted, setHasStarted] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!hasStarted || isDone) return;
    if (prefersReducedMotion) {
      setDisplayText(text);
      setIsDone(true);
      return;
    }
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let revealIndex = 0;

    const startTimer = window.setTimeout(() => {
      const interval = window.setInterval(() => {
        revealIndex += 1;
        const next = text
          .split('')
          .map((char, idx) => {
            if (char === ' ') return ' ';
            if (idx < revealIndex) return char;
            return alphabet[Math.floor(Math.random() * alphabet.length)];
          })
          .join('');

        setDisplayText(next);

        if (revealIndex >= text.length) {
          window.clearInterval(interval);
          setDisplayText(text);
          setIsDone(true);
        }
      }, 85);
    }, Math.max(0, delay) * 1000);

    return () => {
      window.clearTimeout(startTimer);
    };
  }, [delay, hasStarted, isDone, prefersReducedMotion, text]);

  return (
    <motion.span
      className="inline-block"
      onViewportEnter={() => setHasStarted(true)}
      viewport={{ once: true, amount: 0.65 }}
    >
      {isDone ? text : displayText}
    </motion.span>
  );
}

function XLogoIcon({ className, size = 18 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={className}
      width={size}
      height={size}
    >
      <path
        fill="currentColor"
        d="M18.18 3H21l-7.76 8.87L22.36 21H16.7l-5.45-6.84L5.25 21H2.43l8.14-9.31L1.64 3h5.82l5 6.28L18.18 3Zm-1.24 16h1.57L6.54 5H4.82l12.12 14Z"
      />
    </svg>
  );
}

const pageReveal = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

function toTitleCase(value: string) {
  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function buildShuffledTrackPool(total: number, excludeIndex: number) {
  const indices: number[] = [];
  for (let i = 0; i < total; i += 1) {
    if (i !== excludeIndex) indices.push(i);
  }

  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  return indices;
}

export default function Home() {
  const pathname = usePathname();
  const [mainView, setMainView] = useState<'home' | 'projects' | 'experience'>('home');
  const [projectsViewEpoch, setProjectsViewEpoch] = useState(0);
  const [experienceViewEpoch, setExperienceViewEpoch] = useState(0);
  const isProjectsPage = mainView === 'projects';
  const isExperiencePage = mainView === 'experience';
  const isHomePage = mainView === 'home';
  const [shouldAnimateGlobalTopBar] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.sessionStorage.getItem('ayaan-global-topbar-animated') !== '1';
  });
  const { resolvedTheme, setTheme } = useTheme();
  const { epoch: entranceReplayEpoch, bumpEntranceAnimations } = useThemeEntranceReplay();
  const [themeMounted, setThemeMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDesktopSidebarReleased, setIsDesktopSidebarReleased] = useState(false);
  const [lifetimeVisits, setLifetimeVisits] = useState<number | null>(null);
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordRotation, setRecordRotation] = useState(0);
  const [trackLikeCounts, setTrackLikeCounts] = useState<Record<string, number>>({});
  const [likedTracks, setLikedTracks] = useState<Record<string, boolean>>({});
  const [likePendingTrackFile, setLikePendingTrackFile] = useState<string | null>(null);
  const [upcomingTrackIndex, setUpcomingTrackIndex] = useState(() =>
    musicTracks.length > 1 ? 1 : 0
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);
  const shuffledPoolRef = useRef<number[]>([]);
  const playedHistoryRef = useRef<number[]>([]);
  const preloadAudioRef = useRef<HTMLAudioElement | null>(null);
  const mainContentRef = useRef<HTMLDivElement | null>(null);
  const webringContainerRef = useRef<HTMLDivElement | null>(null);
  const rotationRef = useRef(0);
  const rotationFrameRef = useRef<number | null>(null);
  // Parallax for the GIF popup driven by motion values — these write
  // straight to the DOM via framer-motion and DO NOT trigger React
  // re-renders. The RAF loop only runs WHILE a tag is hovered, so it
  // adds zero cost when the user is just browsing the site.
  const mouseX = useMotionValue(0);
  const delayedMouseX = useMotionValue(0);
  const parallaxMargin = useTransform(
    delayedMouseX,
    (v) => `calc(-120px + ${v * 0.45}px)`
  );

  // Cached center X of the currently hovered tag (in viewport coords)
  const hoveredTagCenterRef = useRef<number | null>(null);

  useEffect(() => {
    setThemeMounted(true);
  }, []);

  const prefersReducedMotion = useReducedMotion();
  const revealVariants = prefersReducedMotion
    ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } }
    : pageReveal;

  // While a tag is hovered: listen for mousemove globally AND run an
  // RAF lerp loop. Both stop the moment the tag is unhovered so they
  // never run while the user is just browsing.
  useEffect(() => {
    if (!hoveredTag) {
      mouseX.set(0);
      delayedMouseX.set(0);
      return;
    }

    const handler = (e: MouseEvent) => {
      if (hoveredTagCenterRef.current === null) return;
      mouseX.set(e.clientX - hoveredTagCenterRef.current);
    };
    document.addEventListener('mousemove', handler);

    let rafId: number;
    const tick = () => {
      const target = mouseX.get();
      const current = delayedMouseX.get();
      const delta = target - current;
      const easedProgress = 1 - Math.pow(1 - 0.08, Math.min(Math.abs(delta) / 120, 3));
      delayedMouseX.set(current + delta * easedProgress);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener('mousemove', handler);
      cancelAnimationFrame(rafId);
    };
  }, [hoveredTag, mouseX, delayedMouseX]);

  useEffect(() => {
    const container = webringContainerRef.current;
    if (!container) return;

    container.replaceChildren();
    const script = document.createElement('script');
    script.src = 'https://uwaterloo.network/embed.js';
    script.setAttribute('data-webring', '');
    script.setAttribute('data-user', 'ayaan-faisal');
    script.setAttribute('data-color', 'custom');
    script.setAttribute('data-custom-color', '#36c1e1');
    script.async = true;
    container.appendChild(script);

    return () => {
      container.replaceChildren();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const desktopMedia = window.matchMedia('(min-width: 1024px)');
    let rafId: number | null = null;

    const updateSidebarMode = () => {
      rafId = null;

      if (!desktopMedia.matches) {
        setIsDesktopSidebarReleased(false);
        return;
      }

      const mainContent = mainContentRef.current;
      if (!mainContent) return;

      const { bottom } = mainContent.getBoundingClientRect();
      const shouldRelease = bottom <= window.innerHeight;
      setIsDesktopSidebarReleased((prev) =>
        prev === shouldRelease ? prev : shouldRelease
      );
    };

    const onScrollOrResize = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(updateSidebarMode);
    };

    updateSidebarMode();
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);
    desktopMedia.addEventListener('change', onScrollOrResize);

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      desktopMedia.removeEventListener('change', onScrollOrResize);
    };
  }, []);

  useEffect(() => {
    if (!shouldAnimateGlobalTopBar) return;
    window.sessionStorage.setItem('ayaan-global-topbar-animated', '1');
  }, [shouldAnimateGlobalTopBar]);

  useEffect(() => {
    if (pathname !== '/') {
      setMainView('home');
    }
  }, [pathname]);

  const socials = [
    { icon: Github, href: 'https://github.com/appleayaan', label: 'GitHub' },
    { icon: Linkedin, href: 'https://www.linkedin.com/in/ayaanfaisal18/', label: 'LinkedIn' },
    { icon: XLogoIcon, href: 'https://x.com/ayaanyyz', label: 'X' },
    { icon: Instagram, href: 'https://www.instagram.com/ayaan.visuals/', label: 'Instagram' },
    { icon: Mail, href: 'mailto:a34faisa@uwaterloo.ca', label: 'Email' },
  ];

  const currentTrack = musicTracks[currentTrackIndex];
  const upcomingTrack = musicTracks[upcomingTrackIndex];
  const isDrakeTrack = currentTrack.artist.toLowerCase().includes('drake');
  const currentTrackLikeCount = trackLikeCounts[currentTrack.file] ?? 0;
  const currentTrackLiked = likedTracks[currentTrack.file] ?? false;

  const navigateMainView = useCallback((view: 'home' | 'projects' | 'experience') => {
    if (view === 'projects') {
      setProjectsViewEpoch((prev) => prev + 1);
    } else if (view === 'experience') {
      setExperienceViewEpoch((prev) => prev + 1);
    }
    setMainView(view);
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 1023px)').matches
    ) {
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    const onMainViewCommand = (event: Event) => {
      const detail = (
        event as CustomEvent<{ view: 'home' | 'projects' | 'experience' }>
      ).detail;
      if (!detail?.view) return;
      navigateMainView(detail.view);
    };
    window.addEventListener('command-main-view', onMainViewCommand);
    return () =>
      window.removeEventListener('command-main-view', onMainViewCommand);
  }, [navigateMainView]);

  const syncUpcomingTrack = useCallback((currentIndex: number) => {
    if (musicTracks.length <= 1) {
      setUpcomingTrackIndex(currentIndex);
      return;
    }

    if (shuffledPoolRef.current.length === 0) {
      shuffledPoolRef.current = buildShuffledTrackPool(musicTracks.length, currentIndex);
    }

    const nextPreview =
      shuffledPoolRef.current[shuffledPoolRef.current.length - 1] ?? currentIndex;
    setUpcomingTrackIndex(nextPreview);
  }, []);

  const nextTrack = useCallback(() => {
    setCurrentTrackIndex((prev) => {
      if (musicTracks.length <= 1) return prev;

      playedHistoryRef.current.push(prev);
      if (shuffledPoolRef.current.length === 0) {
        shuffledPoolRef.current = buildShuffledTrackPool(musicTracks.length, prev);
      }

      const nextIndex = shuffledPoolRef.current.pop() ?? prev;
      syncUpcomingTrack(nextIndex);
      return nextIndex;
    });
  }, [syncUpcomingTrack]);

  const previousTrack = useCallback(() => {
    setCurrentTrackIndex((prev) => {
      const previousIndex = playedHistoryRef.current.pop();
      if (typeof previousIndex !== 'number') return prev;

      if (musicTracks.length > 1 && previousIndex !== prev) {
        shuffledPoolRef.current.push(prev);
      }
      syncUpcomingTrack(previousIndex);
      return previousIndex;
    });
  }, [syncUpcomingTrack]);

  const setTrackDirectly = useCallback(
    (trackIndex: number) => {
      playedHistoryRef.current = [];
      shuffledPoolRef.current = buildShuffledTrackPool(musicTracks.length, trackIndex);
      setCurrentTrackIndex(trackIndex);
      syncUpcomingTrack(trackIndex);
    },
    [syncUpcomingTrack]
  );

  useEffect(() => {
    syncUpcomingTrack(currentTrackIndex);
  }, [currentTrackIndex, syncUpcomingTrack]);

  useEffect(() => {
    if (musicTracks.length <= 1) return;
    const randomIndex = Math.floor(Math.random() * musicTracks.length);
    setTrackDirectly(randomIndex);
  }, [setTrackDirectly]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      nextTrack();
      setIsPlaying(true);
    };

    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('ended', onEnded);
    };
  }, [nextTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.src = currentTrack.src;
    audio.load();
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [currentTrackIndex, currentTrack.src]);

  useEffect(() => {
    const preloadAudio = preloadAudioRef.current;
    if (!preloadAudio) return;
    if (!upcomingTrack?.src) return;

    preloadAudio.src = upcomingTrack.src;
    preloadAudio.load();
  }, [upcomingTrack?.src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    let cancelled = false;
    const loadTrackLikeState = async () => {
      try {
        const response = await fetch(
          `/api/music-likes?track=${encodeURIComponent(currentTrack.file)}`,
          { cache: 'no-store' }
        );
        if (!response.ok) return;
        const data: { track?: string; count?: number; liked?: boolean } = await response.json();
        if (cancelled || data.track !== currentTrack.file) return;
        setTrackLikeCounts((prev) => ({
          ...prev,
          [currentTrack.file]: typeof data.count === 'number' ? data.count : 0,
        }));
        setLikedTracks((prev) => ({
          ...prev,
          [currentTrack.file]: Boolean(data.liked),
        }));
      } catch {
        // noop: likes are non-blocking UI sugar
      }
    };
    loadTrackLikeState();
    return () => {
      cancelled = true;
    };
  }, [currentTrack.file]);

  const likeCurrentTrack = async () => {
    const trackFile = currentTrack.file;
    if (likedTracks[trackFile] || likePendingTrackFile === trackFile) return;

    setLikePendingTrackFile(trackFile);
    setLikedTracks((prev) => ({ ...prev, [trackFile]: true }));
    setTrackLikeCounts((prev) => ({
      ...prev,
      [trackFile]: (prev[trackFile] ?? 0) + 1,
    }));

    try {
      const response = await fetch('/api/music-likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track: trackFile }),
      });
      if (!response.ok) throw new Error('like failed');

      const data: { track?: string; count?: number; liked?: boolean } = await response.json();
      if (data.track === trackFile) {
        setTrackLikeCounts((prev) => ({
          ...prev,
          [trackFile]: typeof data.count === 'number' ? data.count : prev[trackFile] ?? 0,
        }));
        setLikedTracks((prev) => ({ ...prev, [trackFile]: Boolean(data.liked) }));
      }
    } catch {
      // Revert optimistic update if request fails.
      setLikedTracks((prev) => ({ ...prev, [trackFile]: false }));
      setTrackLikeCounts((prev) => ({
        ...prev,
        [trackFile]: Math.max(0, (prev[trackFile] ?? 1) - 1),
      }));
    } finally {
      setLikePendingTrackFile((prev) => (prev === trackFile ? null : prev));
    }
  };

  useEffect(() => {
    if (!isPlaying) {
      if (rotationFrameRef.current !== null) {
        cancelAnimationFrame(rotationFrameRef.current);
        rotationFrameRef.current = null;
      }
      return;
    }

    const spin = () => {
      rotationRef.current = (rotationRef.current + 0.8) % 360;
      setRecordRotation(rotationRef.current);
      rotationFrameRef.current = requestAnimationFrame(spin);
    };

    rotationFrameRef.current = requestAnimationFrame(spin);

    return () => {
      if (rotationFrameRef.current !== null) {
        cancelAnimationFrame(rotationFrameRef.current);
        rotationFrameRef.current = null;
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    let isCancelled = false;

    const updateLifetimeVisits = async () => {
      try {
        const response = await fetch('/api/visitors');
        if (!response.ok) {
          if (!isCancelled) setLifetimeVisits(-1);
          return;
        }

        const data: { value?: number } = await response.json();
        if (!isCancelled && typeof data.value === 'number') {
          setLifetimeVisits(data.value);
        }
      } catch {
        if (!isCancelled) setLifetimeVisits(-1);
      }
    };

    updateLifetimeVisits();

    return () => {
      isCancelled = true;
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  };

  useEffect(() => {
    const onToggle = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (isPlayingRef.current) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    };
    const onNext = () => {
      nextTrack();
    };
    const onPrevious = () => {
      previousTrack();
    };
    const onOvo = () => {
      const drakeIndices = musicTracks
        .map((track, index) =>
          track.artist.toLowerCase().includes('drake') ? index : -1
        )
        .filter((index) => index >= 0);
      if (drakeIndices.length === 0) return;

      const randomIndex =
        drakeIndices[Math.floor(Math.random() * drakeIndices.length)];
      setTrackDirectly(randomIndex);
      setIsPlaying(true);
    };

    window.addEventListener('command-music-toggle', onToggle);
    window.addEventListener('command-music-next', onNext);
    window.addEventListener('command-music-previous', onPrevious);
    window.addEventListener('command-music-ovo', onOvo);

    return () => {
      window.removeEventListener('command-music-toggle', onToggle);
      window.removeEventListener('command-music-next', onNext);
      window.removeEventListener('command-music-previous', onPrevious);
      window.removeEventListener('command-music-ovo', onOvo);
    };
  }, [nextTrack, previousTrack, setTrackDirectly]);

  const tagColors = [
    { bg: '#ffd4d4', hoverBg: '#ff8a8a' }, // TBD
    { bg: '#d68fff', hoverBg: '#c058fc' }, // @Halo Halo
    { bg: '#edff4f', hoverBg: '#d1c700' }, // WATSMyGPA
    { bg: '#e0e0e0', hoverBg: '#000000' }, // Velocity
    { bg: '#cfeefe', hoverBg: '#19679e' }, // ayaan.visuals
    { bg: '#c9c9c9', hoverBg: '#000000' }, // X
    { bg: '#abc1ed', hoverBg: '#0072b1' }, // LinkedIn
    { bg: '#ffb870', hoverBg: '#e87500' }, // Claude Code
  ];

  const tagLinks: Record<string, string> = {
    'TBD': 'https://ayaanfaisal.com/tbd',
    '@Halo Halo': 'https://halohaloapp.com',
    'WATSMyGPA': 'https://watsmygpa.me',
    'Velocity': 'https://www.velocityincubator.com/',
    '@ayaan.visuals': 'https://www.instagram.com/ayaan.visuals/',
    'UWaterloo': 'https://uwaterloo.ca',
    'X': 'https://x.com/ayaanyyz',
    'LinkedIn': 'https://www.linkedin.com/in/ayaanfaisal18/',
    'Claude Code': 'https://www.claude.ai/',
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const tagMediaToPreload = [
      { src: '/tag-gifs/tbd.gif', type: 'image' as const },
      { src: '/tag-gifs/watsmygpa.gif', type: 'image' as const },
      { src: '/tag-gifs/velocity.gif', type: 'image' as const },
      { src: '/tag-gifs/halohalo.webm', type: 'video' as const },
      { src: '/tag-gifs/halohalo.mp4', type: 'video' as const },
      { src: '/tag-gifs/ayaan.visuals.gif', type: 'image' as const },
      { src: '/tag-gifs/X.gif', type: 'image' as const },
      { src: '/tag-gifs/linkedin.gif', type: 'image' as const },
      { src: '/tag-gifs/uwaterloo.gif', type: 'image' as const },
      { src: '/tag-gifs/uwaterloo.png', type: 'image' as const },
      { src: '/tag-gifs/claude.webm', type: 'video' as const },
      { src: '/tag-gifs/claude.mp4', type: 'video' as const },
    ];

    const preloadAllTagMedia = () => {
      for (const media of tagMediaToPreload) {
        if (media.type === 'image') {
          const img = new Image();
          img.decoding = 'async';
          img.src = media.src;
        } else {
          const video = document.createElement('video');
          video.preload = 'metadata';
          video.muted = true;
          video.playsInline = true;
          video.src = media.src;
          video.load();
        }
      }
    };

    const schedulePreload = () => {
      if ('requestIdleCallback' in window) {
        (
          window as Window & {
            requestIdleCallback: (
              callback: IdleRequestCallback,
              options?: IdleRequestOptions
            ) => number;
          }
        ).requestIdleCallback(() => preloadAllTagMedia(), { timeout: 2500 });
      } else {
        setTimeout(preloadAllTagMedia, 1200);
      }
    };

    if (document.readyState === 'complete') {
      schedulePreload();
      return;
    }

    window.addEventListener('load', schedulePreload, { once: true });
    return () => window.removeEventListener('load', schedulePreload);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const projectMediaToPreload = [
      { src: '/tag-gifs/ayaanfaisal.com.webm', type: 'video' as const },
      { src: '/tag-gifs/ayaanfaisal.com.mp4', type: 'video' as const },
      { src: '/tag-gifs/watsmygpa.gif', type: 'image' as const },
      { src: '/tag-gifs/packright.webm', type: 'video' as const },
      { src: '/tag-gifs/packright.mp4', type: 'video' as const },
    ];

    const preloadProjectsMedia = () => {
      for (const media of projectMediaToPreload) {
        if (media.type === 'image') {
          const img = new Image();
          img.decoding = 'async';
          img.src = media.src;
        } else {
          const video = document.createElement('video');
          video.preload = 'metadata';
          video.muted = true;
          video.playsInline = true;
          video.src = media.src;
          video.load();
        }
      }
    };

    if ('requestIdleCallback' in window) {
      (
        window as Window & {
          requestIdleCallback: (
            callback: IdleRequestCallback,
            options?: IdleRequestOptions
          ) => number;
        }
      ).requestIdleCallback(() => preloadProjectsMedia(), { timeout: 3200 });
    } else {
      setTimeout(preloadProjectsMedia, 1400);
    }
  }, []);

  const experiences = [
    {
      title: 'incoming',
      items: [
        { text: 'TBD', type: 'tag', tagIdx: 0 },
        { text: '💔 , prev', type: 'plain' },
        { text: '@Halo Halo', type: 'tag', tagIdx: 1 },
      ],
    },
    {
      title: 'launched',
      items: [
        { text: 'WATSMyGPA', type: 'tag', tagIdx: 2 },
        {
          text: (
            <span>
              , a <HandDrawnUnderline delay={2.2}>privacy-first</HandDrawnUnderline> UW GPA Calculator.
            </span>
          ),
          type: 'plain',
        },
      ],
    },
    {
      title: 'growing the',
      items: [
        { text: 'Velocity', type: 'tag', tagIdx: 3 },
        {
          text: (
            <span>
              <HandDrawnUnderline delay={2.4}>startup community</HandDrawnUnderline> @ UW Campus.
            </span>
          ),
          type: 'plain',
        },
      ],
    },
    {
      title: (
        <span>
          <HandDrawnUnderline delay={2.6}>actively creating</HandDrawnUnderline>{' '}
          <span className="relative inline-block">
            <span>AI slop</span>
            <motion.span
              aria-hidden="true"
              className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 bg-[#9fd0ea]"
              initial={{ scaleX: prefersReducedMotion ? 1 : 0, opacity: prefersReducedMotion ? 1 : 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.35,
                ease: 'easeOut',
                delay: prefersReducedMotion ? 0 : 2.75,
              }}
              style={{ transformOrigin: 'left center' }}
            />
          </span>{' '}
          content and posting on:
        </span>
      ),
      items: [
        { text: '@ayaan.visuals', type: 'tag', tagIdx: 4 },
        { text: ',', type: 'plain' },
        { text: 'X', type: 'tag', tagIdx: 5, icon: 'x-logo' },
        { text: ',', type: 'plain' },
        { text: 'LinkedIn.', type: 'tag', tagIdx: 6, icon: 'linkedin-logo' }
      ],
    },
    {
      title: (
        <span>
          <HandDrawnUnderline delay={2.8}>building and sidequesting</HandDrawnUnderline>{' '}
          all the time w/
        </span>
      ),
      items: [{ text: 'Claude Code', type: 'tag', tagIdx: 7 }],
    },
    {
      title: (
        <b>
          <HandDrawnUnderline delay={3.0}>seeking fall 2026</HandDrawnUnderline>
        </b>
      ),
      items: [
        { 
          text: (
            <motion.a
              href="https://www.google.com/search?q=what+is+a+job."
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] min-w-[44px] items-center hover:text-[#688dbc] transition-colors duration-300 cursor-pointer px-2 sm:inline-block sm:min-h-0 sm:min-w-0 sm:px-0 sm:mx-0"
              {...(!prefersReducedMotion
                ? {
                    animate: {
                      rotate: [0, -2, 1.5, -1.5, 1, 0],
                      y: [0, -1, 0, 1, 0],
                    },
                    transition: {
                      duration: 2.4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    },
                  }
                : {})}
            >
              <b>
                <HandDrawnUnderline delay={3.2}>internships/co-ops</HandDrawnUnderline>
              </b>
            </motion.a>
          ),
          type: 'plain'
        },
        { text: ' opportunities! 🥳', type: 'plain' },
   
      ],
    },
  ];

  // --------------------------------
  // projects are sorted by date
  // --------------------------------
  const projects = [
    {
      title: 'Mother\'s Day',
      date: "may '26",
      description:
        <>
        a <HandDrawnUnderline delay={0.28} triggerOnView>personal gift</HandDrawnUnderline> for mother's day.{' '}
        <HandDrawnUnderline delay={0.46} triggerOnView>(1.2K+ views</HandDrawnUnderline>, {' '}
        <HandDrawnUnderline delay={0.64} triggerOnView>350+ visits</HandDrawnUnderline>overall).
        {' '}<HandDrawnUnderline delay={0.82} triggerOnView>happy mother's day!</HandDrawnUnderline>
        </>,
      url: { href: 'http://www.happymothers-day2026.vercel.app', target: '_blank', rel: 'noreferrer' },
      gifSrc: '/tag-gifs/mothersday.gif',
      gifAlt: 'Mother\'s Day project preview',
    },
    {
      title: 'ayaanfaisal.com',
      date: "apr '26",
      description:
        <>
        an <HandDrawnUnderline delay={0.28} triggerOnView>interactive and fun portfolio</HandDrawnUnderline> built with Next.js and <HandDrawnUnderline delay={0.46} triggerOnView>Tailwind CSS</HandDrawnUnderline>. check out my projects and updates!
     
     
        </>,
      url: { href: '/', target: '_self', rel: 'noreferrer' },
      gifSrc: '/tag-gifs/ayaanfaisal.com.webm',
      mediaType: 'video',
      gifAlt: 'Ayaan Faisal personal website preview',
    },
    {
      title: 'WatsMyGPA',
      date: "jan '26",
      description:
        <>
        An <HandDrawnUnderline delay={0.34} triggerOnView>ML-powered</HandDrawnUnderline> platform that predicts GPA trends and provides <HandDrawnUnderline delay={0.54} triggerOnView>anonymized academic</HandDrawnUnderline> performance insights across UW programs.
     
        </>,
      url: { href: 'https://watsmygpa.me', target: '_blank', rel: 'noreferrer' },
      gifSrc: '/tag-gifs/watsmygpa.gif',
      gifAlt: 'WatsMyGPA project preview',
    },
    {
      title: 'PackRight',
      date: "oct '25",
      description:
        <>
        an <HandDrawnUnderline delay={0.4} triggerOnView>iOS packing assistant app</HandDrawnUnderline> designed to help users <HandDrawnUnderline delay={0.62} triggerOnView>reduce trip-prep time by 40%</HandDrawnUnderline>. PackRight is built with SwiftUI and XCode.
        </>,
      url: { href: 'https://github.com/AppleAyaan/PackRight', target: '_blank', rel: 'noreferrer' },
      gifSrc: '/tag-gifs/packright.webm',
      mediaType: 'video',
      gifAlt: 'PackRight project preview',
    },
  ];

  const renderItem = (item: any, itemIndex: number, expIndex: number) => {
    if (item.type === 'tag') {
      const uniqueId = `tag-${expIndex}-${itemIndex}`;
      const color = tagColors[item.tagIdx % tagColors.length];
      const isHovered = hoveredTag === uniqueId;
      const normalizedTagText = item.text.replace(/[.,!?]+$/, '');
      const tagHref =
        tagLinks[normalizedTagText] ??
        tagLinks[item.text] ??
        `https://www.google.com/search?q=${encodeURIComponent(
          item.text.replace(/^@/, '')
        )}`;

      return (
        <div
          key={itemIndex}
          className="relative mx-0.5 inline-block align-middle first:ml-0"
        >
          <a
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              hoveredTagCenterRef.current = rect.left + rect.width / 2;
              setHoveredTag(uniqueId);
            }}
            onMouseLeave={() => {
              setHoveredTag(null);
              hoveredTagCenterRef.current = null;
            }}
            href={tagHref}
            target="_blank"
            rel="noreferrer"
            style={{
              backgroundColor: isHovered ? color.hoverBg : color.bg,
              color: isHovered ? '#ffffff' : '#000000',
            }}
            className={`relative z-10 box-border inline-flex items-center rounded-none px-[5px] py-[2px] text-[0.8rem] font-medium leading-[1.15] transition-all duration-300 min-h-[1.45em] sm:min-h-[1.5em] sm:px-1.5 sm:py-[3px] sm:text-sm lg:min-h-[1.52em] lg:px-2 lg:py-0.5 lg:text-base no-underline hover:no-underline focus:no-underline max-sm:touch-manipulation ${item.icon ? 'min-w-[1.92em] justify-center' : ''}`}
          >
            {item.icon === 'x-logo' ? (
              <svg
                viewBox="0 0 24 24"
                className="h-[1.12em] w-[1.12em] shrink-0 translate-y-[0.02em]"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  fill="currentColor"
                  d="M18.9 2H22l-6.9 7.9L23 22h-6.9l-5.4-6.8L4.8 22H1.7l7.4-8.5L1 2h7l4.9 6.2L18.9 2Zm-1.2 18h2L7.9 4h-2l11.8 16Z"
                />
              </svg>
            ) : item.icon === 'linkedin-logo' ? (
              <Linkedin
                aria-hidden="true"
                className="h-[1.12em] w-[1.12em] shrink-0 translate-y-[0.02em]"
              />
            ) : (
              item.text
            )}
          </a>

          {/* GIF Popup on Hover - Above the tag.
              marginLeft is a motion value -> no React re-renders. */}
          {isHovered && (
            <motion.div
              className="absolute bottom-full left-1/2 mb-3 bg-gray-700 overflow-hidden shadow-lg z-20 pointer-events-none"
              style={{
                width: 'min(240px, 28vw)',
                aspectRatio: '16 / 9',
                border: '3px solid rgba(255, 255, 255, 1)',
                boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.18)',
                animation: 'popUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                marginLeft: parallaxMargin,
              }}
            >
              <style>{`
                @keyframes popUp {
                  0% {
                    opacity: 0;
                    transform: scale(0.3) translateY(20px);
                  }
                  100% {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                  }
                }
              `}</style>
              {item.text === 'TBD' ? (
                <img
                  src="/tag-gifs/tbd.gif"
                  alt="tbd popup gif"
                  className="w-full h-full object-cover object-[center_70%] block"
                />
              ) : item.text === 'WATSMyGPA' ? (
                <img
                  src="/tag-gifs/watsmygpa.gif"
                  alt="wats my gpa popup gif"
                  className="w-full h-full object-cover block"
                />
              ) : item.text === 'Velocity' ? (
                <img
                  src="/tag-gifs/velocity.gif"
                  alt="velocity popup gif"
                  className="w-full h-full object-cover block"
                />
              ) : item.text === '@Halo Halo' ? (
                <AutoplayLoopVideo
                  webmSrc="/tag-gifs/halohalo.webm"
                  className="w-full h-full object-cover block"
                />
              ) : item.text === '@ayaan.visuals' ? (
                <img
                  src="/tag-gifs/ayaan.visuals.gif"
                  alt="ayaan visuals popup gif"
                  className="w-full h-full object-cover block"
                />
              ) : item.text === 'X' ? (
                <img
                  src="/tag-gifs/X.gif"
                  alt="x popup gif"
                  className="w-full h-full object-cover block"
                />
              ) : typeof item.text === 'string' && item.text.replace(/[.,!?]+$/, '') === 'LinkedIn' ? (
                <img
                  src="/tag-gifs/linkedin.gif"
                  alt="linkedin popup gif"
                  className="w-full h-full object-cover block"
                />
              ) : item.text === '@University' ? (
                <img
                  src="/tag-gifs/uwaterloo.png"
                  alt="uwaterloo popup gif"
                  className="w-full h-full object-cover block"
                />
              ) : item.text === 'Claude Code' ? (
                <AutoplayLoopVideo
                  webmSrc="/tag-gifs/claude.webm"
                  className="w-full h-full object-cover block"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-gray-600 to-gray-800 flex items-center justify-center text-white text-xs font-semibold">
                  GIF PLACEHOLDER
                </div>
              )}
            </motion.div>
          )}
        </div>
      );
    }

    if (item.type === 'underline') {
      return (
        <span key={itemIndex} className="underline underline-offset-2 font-medium text-inherit cursor-pointer hover:opacity-80 transition-opacity">
          {item.text}
        </span>
      );
    }

    return (
      <span key={itemIndex} className="text-inherit">
        {item.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      <Script
        id="person-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: 'Ayaan Faisal',
            url: 'https://ayaanfaisal.com',
            sameAs: [
              'https://github.com/appleayaan',
              'https://www.linkedin.com/in/ayaanfaisal18/',
              'https://x.com/ayaanyyz',
              'https://www.instagram.com/ayaan.visuals/',
            ],
            jobTitle: 'Undergraduate Math/CS Student',
            alumniOf: {
              '@type': 'CollegeOrUniversity',
              name: 'University of Waterloo',
            },
            description:
              'Undergraduate Math/CS student at the University of Waterloo seeking co-op opportunities.',
          }),
        }}
      />
      {/* Main Content Container */}
      <div ref={mainContentRef} className="flex relative">
        {/* Left Sidebar - Fixed on desktop until carousel boundary */}
        <div className="hidden lg:block lg:w-48 lg:shrink-0">
        <aside
          data-sticker-no-drop="true"
          className={`flex h-screen bg-background flex-col px-6 py-12 justify-between z-20 ${isDesktopSidebarReleased ? 'absolute bottom-0 left-0' : 'fixed top-0 left-0'}`}
        >
          {/* Top Navigation */}
          <div className="flex flex-col gap-12">
            {/* Me */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                navigateMainView('home');
              }}
              className={`text-sm font-light cursor-pointer text-right block w-full ${isHomePage ? 'text-foreground font-semibold scale-[1.03]' : 'text-muted-foreground/80 hover:text-muted-foreground dark:text-muted-foreground dark:hover:text-foreground'
                }`}
            >
              me
            </button>

            {/* Navigation */}
            <nav className="flex flex-col gap-12 text-sm">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  navigateMainView('experience');
                }}
                className={`font-light cursor-pointer text-right transition-colors w-full ${isExperiencePage ? 'text-foreground font-semibold scale-[1.03]' : 'text-muted-foreground/80 hover:text-muted-foreground dark:text-muted-foreground dark:hover:text-foreground'
                  }`}
              >
                experience
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  navigateMainView('projects');
                }}
                className={`font-light cursor-pointer text-right transition-colors w-full ${isProjectsPage ? 'text-foreground font-semibold scale-[1.03]' : 'text-muted-foreground/80 hover:text-muted-foreground dark:text-muted-foreground dark:hover:text-foreground'
                  }`}
              >
                projects
              </button>
              <Link
                href="https://www.instagram.com/ayaan.visuals/"
                className={`font-light cursor-pointer text-right transition-colors ${pathname === '/ayaan-visuals' ? 'text-foreground font-semibold scale-[1.03]' : 'text-muted-foreground/80 hover:text-muted-foreground dark:text-muted-foreground dark:hover:text-foreground'
                  }`}
              >
                @ayaan.visuals
              </Link>
            </nav>
          </div>

          {/* Music Player at Bottom */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <button
                className="p-1 text-foreground/85 hover:text-foreground transition-colors cursor-pointer"
                aria-label="Previous track"
                onClick={previousTrack}
              >
                <SkipBack size={14} />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                className="w-20 h-20 rounded-full bg-secondary shadow-md flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
                aria-label={isPlaying ? 'Pause track' : 'Play track'}
              >
                <motion.div
                  style={{ rotate: `${recordRotation}deg` }}
                  className="relative w-[76px] h-[76px] rounded-full overflow-hidden border border-black/20 shadow-[inset_0_0_10px_rgba(0,0,0,0.2)] bg-black"
                >
                  <img
                    src={currentTrack.artSrc}
                    alt={`${currentTrack.title} album art`}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div
                    className="absolute inset-0 rounded-full pointer-events-none opacity-30"
                    style={{
                      backgroundImage:
                        'repeating-radial-gradient(circle at center, rgba(255,255,255,0.18) 0 1px, rgba(0,0,0,0) 1px 7px)',
                    }}
                  />
                  <div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                      background:
                        'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.22), rgba(255,255,255,0) 38%), radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.22) 78%, rgba(0,0,0,0.45) 100%)',
                    }}
                  />
                  <div className="absolute inset-0 rounded-full ring-1 ring-black/20 pointer-events-none" />
                  <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f5f5f5] border border-black/20 shadow-[0_0_0_1px_rgba(255,255,255,0.35)]" />
                </motion.div>
              </button>

              <button
                className="p-1 text-foreground/85 hover:text-foreground transition-colors cursor-pointer"
                aria-label="Next track"
                onClick={nextTrack}
              >
                <SkipForward size={14} />
              </button>
            </div>

            <div className="text-center space-y-0.5">
              <p className="text-xs font-medium text-foreground inline-flex items-center gap-1">
                <span className="mr-1">♪</span>
                {currentTrack.title}
                {currentTrack.explicit ? (
                  <span
                    className="inline-flex h-4 min-w-4 items-center justify-center rounded bg-black/80 px-1 text-[9px] font-semibold leading-none text-white"
                    aria-label="Explicit"
                    title="Explicit"
                  >
                    E
                  </span>
                ) : null}
              </p>
              <div className="space-y-0.5">
                <div className="flex items-center justify-center gap-2">
                  <p className="text-[10px] text-foreground/85">{currentTrack.artist}</p>
                  <button
                    type="button"
                    onClick={likeCurrentTrack}
                    disabled={currentTrackLiked || likePendingTrackFile === currentTrack.file}
                    aria-label={
                      currentTrackLiked
                        ? `Liked ${currentTrack.title}`
                        : `Like ${currentTrack.title}`
                    }
                    className="inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-slate-500 transition-colors hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-85"
                  >
                    <Heart
                      className={`h-3.5 w-3.5 ${currentTrackLiked ? 'fill-rose-500 text-rose-500' : ''}`}
                      strokeWidth={1.9}
                      aria-hidden
                    />
                    <span>{currentTrackLikeCount.toLocaleString()}</span>
                  </button>
                </div>
                <p
                  className={`text-[10px] leading-none text-[#b4975a] transition-all duration-300 ease-out motion-reduce:transition-none dark:text-[#d8b56b] ${
                    isDrakeTrack ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
                  }`}
                  aria-hidden={!isDrakeTrack}
                >
                  im so OVO <span className="text-foreground/85">𓅓</span>
             
                </p>
              </div>
            </div>

          </div>
        </aside>
        </div>

        {/* Right Column */}
        <main className="relative z-30 flex min-w-0 flex-1 flex-col">
          <Fragment key={`home-entrance-${entranceReplayEpoch}`}>
          <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 lg:static lg:z-auto lg:bg-transparent lg:backdrop-blur-none">
          {/* Top Bar with Logo Badge and Social Icons */}
          <motion.div
            className="flex w-full items-start px-4 py-5 sm:px-6 sm:items-center sm:py-6 lg:px-12 min-w-0"
            initial={shouldAnimateGlobalTopBar ? 'hidden' : 'visible'}
            animate="visible"
            variants={revealVariants}
            transition={{
              duration: prefersReducedMotion || !shouldAnimateGlobalTopBar ? 0 : 0.5,
              ease: 'easeOut',
            }}
          >
            <button
              type="button"
              className="lg:hidden mr-3 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border/50 bg-background/85 text-foreground transition-colors hover:bg-muted"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <MenuX className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            {/* Logo Badge */}
            {isHomePage && (
              <div className="hidden sm:block w-12 h-12 overflow-hidden rounded-full flex-shrink-0">
                <img
                  src="/images/me.png"
                  alt="Ayaan Faisal"
                  className="w-full h-full object-cover block"
                />
              </div>
            )}

            {/* Social Icons + Visitors + theme / palette */}
            <div className="ml-auto flex min-w-0 flex-col items-end gap-1.5 pr-0">
              <div className="flex max-w-[calc(100vw-5.5rem)] flex-nowrap items-center justify-end gap-2 sm:max-w-none sm:gap-4">
                {socials.map((social, idx) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={idx}
                      href={social.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={social.label}
                      className="text-foreground/85 hover:text-foreground transition-colors duration-300 inline-flex h-9 w-9 items-center justify-center rounded-full active:bg-muted/60 sm:h-auto sm:w-auto sm:rounded-none sm:active:bg-transparent"
                    >
                      <Icon className="h-[18px] w-[18px] sm:h-[18px] sm:w-[18px]" strokeWidth={1.85} aria-hidden />
                    </a>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-500/90 font-light tracking-wide text-right">
                lifetime visits:{' '}
                {lifetimeVisits === null ? '...' : lifetimeVisits < 0 ? 'n/a' : lifetimeVisits.toLocaleString()}
              </p>
              <div className="hidden sm:flex flex-nowrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    applyThemeWithEntranceReplay(
                      setTheme,
                      resolvedTheme === 'dark' ? 'light' : 'dark',
                      bumpEntranceAnimations
                    )
                  }
                  className="inline-flex items-center justify-center p-1 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={
                    resolvedTheme === 'dark'
                      ? 'Switch to light mode'
                      : 'Switch to dark mode'
                  }
                  title={
                    resolvedTheme === 'dark'
                      ? 'Switch to light mode'
                      : 'Switch to dark mode'
                  }
                >
                  {themeMounted && resolvedTheme === 'dark' ? (
                    <Sun className="h-4 w-4" strokeWidth={1.85} aria-hidden />
                  ) : (
                    <MoonStar className="h-4 w-4" strokeWidth={1.85} aria-hidden />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
                  className="inline-flex items-center rounded-md border border-border/60 bg-background/70 px-2 py-1 text-[10px] font-medium tracking-wide text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Open command palette"
                >
                  ⌘K
                </button>
              </div>
            </div>
          </motion.div>

          {/* Mobile Nav + Music */}
          {mobileMenuOpen && (
            <div className="border-b border-border/25 bg-background/95 px-4 pb-5 backdrop-blur-md supports-[backdrop-filter]:bg-background/90 lg:hidden">
              <div className="space-y-5 rounded-xl border border-border/50 bg-background/95 p-4">
                <nav className="flex flex-col gap-3 text-sm">
                  <Link
                    href="/"
                    onClick={(e) => {
                      e.preventDefault();
                      navigateMainView('home');
                      setMobileMenuOpen(false);
                    }}
                    className={`block w-full text-left font-light cursor-pointer transition-colors ${isHomePage ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    me
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      navigateMainView('experience');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left font-light cursor-pointer transition-colors ${isExperiencePage ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    experience
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      navigateMainView('projects');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left font-light cursor-pointer transition-colors ${isProjectsPage ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    projects
                  </button>
                  <Link
                    href="https://www.instagram.com/ayaan.visuals/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-left font-light cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                  >
                    @ayaan.visuals
                  </Link>
                </nav>

                <div className="pt-1 border-t border-border/40">
                  <div className="flex items-center justify-center gap-4">
                    <button
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground/85 hover:bg-muted hover:text-foreground transition-colors"
                      aria-label="Previous track"
                      onClick={previousTrack}
                    >
                      <SkipBack size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={togglePlay}
                      className="w-16 h-16 rounded-full bg-secondary shadow-md flex items-center justify-center hover:bg-muted transition-colors"
                      aria-label={isPlaying ? 'Pause track' : 'Play track'}
                    >
                      <motion.div
                        style={{ rotate: `${recordRotation}deg` }}
                        className="relative w-[60px] h-[60px] rounded-full overflow-hidden border border-black/20 shadow-[inset_0_0_10px_rgba(0,0,0,0.2)] bg-black"
                      >
                        <img
                          src={currentTrack.artSrc}
                          alt={`${currentTrack.title} album art`}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        <div
                          className="absolute inset-0 rounded-full pointer-events-none opacity-30"
                          style={{
                            backgroundImage:
                              'repeating-radial-gradient(circle at center, rgba(255,255,255,0.18) 0 1px, rgba(0,0,0,0) 1px 7px)',
                          }}
                        />
                        <div
                          className="absolute inset-0 rounded-full pointer-events-none"
                          style={{
                            background:
                              'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.22), rgba(255,255,255,0) 38%), radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.22) 78%, rgba(0,0,0,0.45) 100%)',
                          }}
                        />
                        <div className="absolute inset-0 rounded-full ring-1 ring-black/20 pointer-events-none" />
                        <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f5f5f5] border border-black/20 shadow-[0_0_0_1px_rgba(255,255,255,0.35)]" />
                      </motion.div>
                    </button>

                    <button
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground/85 hover:bg-muted hover:text-foreground transition-colors"
                      aria-label="Next track"
                      onClick={nextTrack}
                    >
                      <SkipForward size={16} />
                    </button>
                  </div>

                  <div className="mt-2 text-center space-y-0.5">
                    <p className="text-xs font-medium text-foreground inline-flex items-center gap-1">
                      <span className="mr-1">♪</span>
                      {currentTrack.title}
                      {currentTrack.explicit ? (
                        <span
                          className="inline-flex h-4 min-w-4 items-center justify-center rounded bg-black/80 px-1 text-[9px] font-semibold leading-none text-white"
                          aria-label="Explicit"
                          title="Explicit"
                        >
                          E
                        </span>
                      ) : null}
                    </p>
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-center gap-2">
                        <p className="text-[10px] text-foreground/85">{currentTrack.artist}</p>
                        <button
                          type="button"
                          onClick={likeCurrentTrack}
                          disabled={currentTrackLiked || likePendingTrackFile === currentTrack.file}
                          aria-label={
                            currentTrackLiked
                              ? `Liked ${currentTrack.title}`
                              : `Like ${currentTrack.title}`
                          }
                          className="inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-slate-500 transition-colors hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-85"
                        >
                          <Heart
                            className={`h-3.5 w-3.5 ${currentTrackLiked ? 'fill-rose-500 text-rose-500' : ''}`}
                            strokeWidth={1.9}
                            aria-hidden
                          />
                          <span>{currentTrackLikeCount.toLocaleString()}</span>
                        </button>
                      </div>
                      <p
                        className={`text-[10px] leading-none text-[#b4975a] transition-all duration-300 ease-out motion-reduce:transition-none dark:text-[#d8b56b] ${
                          isDrakeTrack ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
                        }`}
                        aria-hidden={!isDrakeTrack}
                      >
                        im so OVO
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          </header>

          {/* Hero and Content */}
          <div className="px-4 sm:px-6 lg:px-12 pb-24 sm:pb-32">
            {isHomePage && (
              <motion.div
                className="-mx-4 mb-3 mt-1 scroll-mt-[calc(5.5rem+env(safe-area-inset-top,0px))] sm:mx-0 sm:mt-0 sm:mb-2 lg:-ml-8"
                initial="hidden"
                animate="visible"
                variants={revealVariants}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.5,
                  ease: 'easeOut',
                  delay: prefersReducedMotion ? 0 : 0.08,
                }}
              >
                <HoverName />
                <div className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/65 sm:text-xs lg:hidden">
                  <img
                    src="/images/arrow.svg"
                    alt=""
                    aria-hidden
                    className="h-3.5 w-3.5 -rotate-90 opacity-70 dark:invert"
                  />
                  <span className="tracking-wide">click me</span>
                </div>
              </motion.div>
            )}

            {/* Bio section */}
            <motion.div
              className={`${isProjectsPage || isExperiencePage ? 'max-w-5xl' : 'max-w-3xl'} space-y-6 pl-1.5 pr-0 sm:pr-6 lg:pr-12`}
              initial="hidden"
              animate="visible"
              variants={revealVariants}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.5,
                ease: 'easeOut',
                delay: prefersReducedMotion ? 0 : 0.18,
              }}
            >
              {isHomePage && (
                <div className="space-y-1.5">
                  <p className="text-base lg:text-lg font-medium tracking-tight text-foreground leading-snug">
                    <span className="font-semibold">2A Math @ </span>
                    <span className="relative inline-block align-bottom">
                      {(() => {
                        const color = {
                          bg: '#fff2a8',
                          hoverBg: '#e0c83f',
                        };
                        const isHovered = hoveredTag === 'tag-uwaterloo';
                        return (
                          <>
                            <a
                              onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                hoveredTagCenterRef.current =
                                  rect.left + rect.width / 2;
                                setHoveredTag('tag-uwaterloo');
                              }}
                              onMouseLeave={() => {
                                setHoveredTag(null);
                                hoveredTagCenterRef.current = null;
                              }}
                              href={tagLinks.UWaterloo}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                backgroundColor: isHovered ? color.hoverBg : color.bg,
                                color: isHovered ? '#ffffff' : '#000000',
                              }}
                              className="inline-flex items-center gap-1 rounded-none px-2 py-0.5 text-[0.9em] sm:px-3 sm:py-1 sm:text-[1em] font-medium leading-tight transition-none relative z-10 touch-manipulation no-underline hover:no-underline focus:no-underline"
                            >
                              UWaterloo
                              <img
                                src="/images/waterloo-logo.png"
                                alt=""
                                aria-hidden
                                className="h-[1.08em] w-[1.08em] shrink-0 object-contain"
                              />
                            </a>

                            {/* GIF Popup on Hover - Above the tag */}
                            {hoveredTag === 'tag-uwaterloo' && (
                              <motion.div
                                className="absolute bottom-full left-1/2 mb-3 bg-gray-700 overflow-hidden shadow-lg z-20 pointer-events-none"
                                style={{
                                  width: 'min(240px, 28vw)',
                                  aspectRatio: '16 / 9',
                                  border: '3px solid rgba(255, 255, 255, 1)',
                                  boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.18)',
                                  animation:
                                    'popUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                  marginLeft: parallaxMargin,
                                }}
                              >
                                <style>{`
                                  @keyframes popUp {
                                    0% {
                                      opacity: 0;
                                      transform: scale(0.3) translateY(20px);
                                    }
                                    100% {
                                      opacity: 1;
                                      transform: scale(1) translateY(0);
                                    }
                                  }
                                `}</style>
                                <img
                                  src="/tag-gifs/uwaterloo.gif"
                                  alt="uwaterloo popup gif"
                                  className="w-full h-full object-cover block"
                                />
                              </motion.div>
                            )}
                          </>
                        );
                      })()}
                    </span>
                  </p>
                  <p className="mt-0 text-base text-muted-foreground leading-snug">
                    <em>
                      &quot;
                      <HandDrawnUnderline delay={0.55}>
                        {prefersReducedMotion ? (
                          <span
                            className="inline-block bg-gradient-to-r from-[#b18734] via-[#d8b56b] to-[#e8cf94] bg-clip-text text-transparent"
                            style={{ WebkitBackgroundClip: 'text' }}
                          >
                            you can just build things
                          </span>
                        ) : (
                          <motion.span
                            className="inline-block bg-clip-text text-transparent"
                            style={{
                            backgroundImage:
                              'linear-gradient(110deg, #b18734 0%, #d8b56b 45%, #e8cf94 60%, #b18734 100%)',
                              backgroundSize: '220% 100%',
                            }}
                            animate={{ backgroundPosition: ['0% 50%', '100% 50%'] }}
                            transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
                          >
                            you can just build things
                          </motion.span>
                        )}
                      </HandDrawnUnderline>
                      &quot;
                    </em>
                  </p>
                </div>
              )}

              {isHomePage && (
                <motion.div
                  className="space-y-2 text-sm sm:text-base font-medium tracking-tight mb-16"
                  initial="hidden"
                  animate="visible"
                  variants={revealVariants}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.5,
                    ease: 'easeOut',
                    delay: prefersReducedMotion ? 0 : 0.4,
                    staggerChildren: prefersReducedMotion ? 0 : 0.14,
                  }}
                >
                  {experiences.map((exp, expIdx) => (
                    <motion.div
                      key={expIdx}
                      className="flex flex-nowrap items-baseline gap-x-2"
                      variants={revealVariants}
                    >
                      <span className="text-muted-foreground font-medium shrink-0 select-none">&gt;</span>
                      <div className="min-w-0 flex-1 text-foreground leading-relaxed text-inherit [&_span]:break-words">
                        {exp.title}
                        {' '}
                        {exp.items.map((item, itemIdx) => renderItem(item, itemIdx, expIdx))}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {isExperiencePage && (
                <motion.div
                  key={`experience-section-${experienceViewEpoch}`}
                  initial="hidden"
                  animate="visible"
                  variants={revealVariants}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.34,
                    ease: 'easeOut',
                    delay: 0,
                  }}
                >
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-5 sm:mb-6">
                    experience 🧩
                  </h3>
                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    variants={revealVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.34,
                      ease: 'easeOut',
                      delay: 0,
                      staggerChildren: prefersReducedMotion ? 0 : 0.07,
                    }}
                  >
                    {[
                      {
                        title: 'incoming @ TBD',
                        date: 'Fall \'26',
                        mediaType: 'gif',
                        mediaSrc: '/tag-gifs/tbd.gif',
                        mediaClassName: 'object-[center_72%]',
                        mediaAlt: 'Incoming role placeholder preview',
                        mediaHref: 'https://ayaanfaisal.com/tbd',
                        badge: 'tbd',
                        body: (
                          <>
                            you could be the one to change this.{' '}
                            <HandDrawnUnderline delay={0.28} triggerOnView>
                              <a href="mailto:a34faisa@uwaterloo.ca" className="underline-offset-4 hover:text-blue-300 transition-colors font-bold" rel="noopener noreferrer">
                                contact me!
                              </a>
                            </HandDrawnUnderline>
                       
                            .
                       
                          </>
                        ),
                      },
                      {
                        title: 'Campus Ambassador @ Velocity',
                        date: 'Winter \'26',
                        mediaType: 'gif',
                        mediaSrc: '/tag-gifs/velocity.gif',
                        mediaAlt: 'Velocity gif',
                        mediaHref: 'https://velocityincubator.com',
                        badge: 'idea',
                        body: (
                          <>
                            grew Velocity's campus presence by {' '}
                            <HandDrawnUnderline delay={0.5} triggerOnView>
                              engaging with 100+
                            </HandDrawnUnderline>
                            {' '}students through {' '}
                            <HandDrawnUnderline delay={0.5} triggerOnView>
                              5+ events.
                            </HandDrawnUnderline>
                          </>
                        ),
                      },
                      {
                        title: 'Software Eng @ Halo Halo',
                        date: 'Summer \'24',
                        mediaType: 'video',
                        mediaSrc: '/tag-gifs/halohalo.webm',
                        mediaAlt: 'HaloHalo',
                        mediaHref: 'https://halohaloapp.com',
                        badge: 'draft',
                        body: (
                          <>
                            developed an online game using React.js, {''}
                            <HandDrawnUnderline delay={0.42} triggerOnView>
                              shipped 500+
                            </HandDrawnUnderline>
                            {' '}lines of production code,{' '}
                            <HandDrawnUnderline delay={0.42} triggerOnView>
                              completed 8+
                            </HandDrawnUnderline>
                            {' '}code reviews using Git and GitHub.
                          </>
                        ),
                      },
                      
                    ].map((item, idx) => (
                      <motion.div
                        key={`${item.title}-${experienceViewEpoch}-${idx}`}
                        className=""
                        variants={revealVariants}
                        transition={{
                          duration: prefersReducedMotion ? 0 : 0.3,
                          ease: 'easeOut',
                          staggerChildren: prefersReducedMotion ? 0 : 0.04,
                        }}
                      >
                        <a
                          href={item.mediaHref}
                          target="_blank"
                          rel="noreferrer noopener"
                          aria-label={`${item.title} preview link`}
                          className="group block cursor-pointer rounded-xl px-2 py-2 transition-colors duration-150 sm:mx-0 sm:rounded-none sm:px-0 sm:py-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:bg-secondary/35 sm:active:bg-transparent"
                        >
                          <div className="aspect-video overflow-hidden rounded-xl bg-secondary/40 shadow-[0_8px_24px_rgba(15,23,42,0.2)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
                            {item.mediaType === 'video' ? (
                              <AutoplayLoopVideo
                                webmSrc={item.mediaSrc}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                                preload="metadata"
                              />
                            ) : (
                              <img
                                src={item.mediaSrc}
                                alt={item.mediaAlt}
                                loading="lazy"
                                decoding="async"
                                className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] ${item.mediaClassName ?? ''}`}
                              />
                            )}
                          </div>
                          <div className="space-y-0.5 pt-3 sm:pt-2">
                            <div className="flex items-baseline justify-between gap-3 sm:gap-4">
                              <span className="text-lg sm:text-xl font-semibold text-foreground leading-tight transition-opacity duration-150 group-hover:opacity-90 sm:group-hover:opacity-80">
                                <FlipbookTitle text={item.title} delay={idx * 0.18} />
                              </span>
                              <motion.span
                                className="text-xl sm:text-2xl font-semibold text-slate-500 shrink-0 leading-none tabular-nums"
                                variants={revealVariants}
                              >
                                {item.date}
                              </motion.span>
                            </div>
                            <div className="text-base text-muted-foreground leading-relaxed">
                              {item.body}
                            </div>
                          </div>
                        </a>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              )}

              {!isExperiencePage && (
                <motion.div
                  key={`projects-section-${projectsViewEpoch}`}
                  initial="hidden"
                  animate="visible"
                  variants={revealVariants}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.34,
                    ease: 'easeOut',
                    delay: 0,
                  }}
                >
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-5 sm:mb-6">
                    projects 🚧
                  </h3>
                  <motion.div
                    key={`projects-grid-${projectsViewEpoch}`}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    variants={revealVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.34,
                      ease: 'easeOut',
                      delay: 0,
                      staggerChildren: prefersReducedMotion ? 0 : 0.07,
                    }}
                  >
                    {projects.map((project, idx) => (
                      (() => {
                        const titleUnderlineDelay = idx * 0.22;
                        return (
                      <motion.div
                        key={`${idx}-${projectsViewEpoch}`}
                        className=""
                        variants={revealVariants}
                        transition={{
                          duration: prefersReducedMotion ? 0 : 0.3,
                          ease: 'easeOut',
                          staggerChildren: prefersReducedMotion ? 0 : 0.04,
                        }}
                      >
                        <a
                          href={project.url.href}
                          target={project.url.target}
                          rel={project.url.rel}
                          className="group block cursor-pointer rounded-xl px-2 py-2 transition-colors duration-150 sm:mx-0 sm:rounded-none sm:px-0 sm:py-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:bg-secondary/35 sm:active:bg-transparent"
                        >
                          <div className="aspect-video overflow-hidden rounded-xl bg-secondary/40 shadow-[0_8px_24px_rgba(15,23,42,0.2)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
                            {project.mediaType === 'video' ? (
                              <AutoplayLoopVideo
                                webmSrc={project.gifSrc}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                                preload="metadata"
                              />
                            ) : (
                              <img
                                src={project.gifSrc}
                                alt={project.gifAlt}
                                loading="lazy"
                                decoding="async"
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                              />
                            )}
                          </div>
                          <div className="space-y-0.5 pt-3 sm:pt-2">
                            <div className="flex items-baseline justify-between gap-3 sm:gap-4">
                              <span className="text-lg sm:text-xl font-semibold text-foreground leading-tight transition-opacity duration-150 group-hover:opacity-90 sm:group-hover:opacity-80">
                                <FlipbookTitle text={project.title} delay={titleUnderlineDelay} />
                              </span>
                              <motion.span
                                className="text-xl sm:text-2xl font-semibold text-slate-500 shrink-0 leading-none tabular-nums"
                                variants={revealVariants}
                              >
                                {project.date}
                              </motion.span>
                            </div>
                            <div className="text-base text-muted-foreground leading-relaxed">
                              {project.description}
                            </div>
                          </div>
                        </a>
                      </motion.div>
                        );
                      })()
                    ))}
                  </motion.div>
                </motion.div>
              )}

            </motion.div>
          </div>
          </Fragment>
        </main>
      </div>
      <audio ref={audioRef} preload="auto" />
      <audio ref={preloadAudioRef} preload="auto" aria-hidden className="hidden" />

      {/* Sticker Carousel - Full Width */}
      <div id="sticker-carousel-section" className="w-full bg-background py-3 sm:py-4">
        <Fragment key={`carousel-hint-${entranceReplayEpoch}`}>
        <p className="flex items-center justify-center gap-3 text-[11px] sm:text-xs text-muted-foreground/65 select-none">
          <motion.img
            src="/images/arrow.svg"
            alt=""
            aria-hidden
            className="h-4 w-4 -scale-x-100 -rotate-12 opacity-70 dark:invert sm:h-5 sm:w-5"
            initial={{ opacity: 0, y: -6, x: 4 }}
            whileInView={{ opacity: 0.7, y: 0, x: 0 }}
            viewport={{ once: true, amount: 0.75 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.85, ease: 'easeOut' }}
          />
          <span className="tracking-wide">drag me</span>
          <motion.img
            src="/images/arrow.svg"
            alt=""
            aria-hidden
            className="h-4 w-4 rotate-12 opacity-70 dark:invert sm:h-5 sm:w-5"
            initial={{ opacity: 0, y: -6, x: -4 }}
            whileInView={{ opacity: 0.7, y: 0, x: 0 }}
            viewport={{ once: true, amount: 0.75 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.85, ease: 'easeOut', delay: prefersReducedMotion ? 0 : 0.16 }}
          />
        </p>
        </Fragment>
      </div>
      <StickerCarousel />

      {/* Footer */}
      <footer className="w-full border-t border-border/30 bg-background">
        <div className="w-full px-4 py-6 sm:px-6 lg:px-12 lg:py-8">
          <div className="flex w-full items-center justify-between">
            <img
              src="/images/logo-tab.png"
              alt="Ayaan Faisal logo"
              width={44}
              height={44}
              className="h-10 w-10 shrink-0 object-cover sm:h-11 sm:w-11 lg:h-12 lg:w-12"
            />
      
            <div ref={webringContainerRef} className="shrink-0 self-center origin-center scale-70" />
          </div>

          <div className="mt-4 w-full min-w-0 px-1 text-center">
            <p className="text-[11px] text-muted-foreground font-light transition-transform duration-300 ease-out hover:scale-[1.02] motion-reduce:transition-none motion-reduce:hover:scale-100 sm:text-xs">
              © {new Date().getFullYear()} ayaanfaisal.com
            </p>
            <p className="mx-auto mt-1 max-w-sm text-[10px] leading-snug text-muted-foreground/80 font-light sm:max-w-md sm:text-[11px] sm:leading-normal">
              Designed in{' '}
              <a href="https://www.figma.com" target="_blank" rel="noreferrer" className="underline-offset-4 hover:text-foreground hover:underline transition-colors">
                Figma
              </a>
              . Help from{' '}
              <a href="https://v0.dev" target="_blank" rel="noreferrer" className="underline-offset-4 hover:text-foreground hover:underline transition-colors">
                v0
              </a>
              {' '}
              and{' '}
              <a href="https://cursor.com" target="_blank" rel="noreferrer" className="underline-offset-4 hover:text-foreground hover:underline transition-colors">
                Cursor.
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
