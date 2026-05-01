'use client';

import { Github, Linkedin, Mail, Instagram, SkipBack, SkipForward, Menu, X as MenuX } from 'lucide-react';
import { useState, useEffect, useRef, type ReactNode } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import StickerCarousel from '@/components/sticker-carousel';
import HoverName from '@/components/hover-name';

function HandDrawnUnderline({
  children,
  delay = 0,
  triggerOnView = false,
}: {
  children: ReactNode;
  delay?: number;
  triggerOnView?: boolean;
}) {
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
          initial={{ pathLength: 0, opacity: 0 }}
          animate={triggerOnView ? undefined : { pathLength: 1, opacity: 1 }}
          whileInView={triggerOnView ? { pathLength: 1, opacity: 1 } : undefined}
          viewport={triggerOnView ? { once: true, amount: 0.65 } : undefined}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay }}
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
  const [displayText, setDisplayText] = useState(' '.repeat(text.length));
  const [hasStarted, setHasStarted] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!hasStarted || isDone) return;
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
  }, [delay, hasStarted, isDone, text]);

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

const musicTracks = [
  { file: 'NOKIA - drake.mp3', title: 'NOKIA', artist: 'Drake', artFile: 'nokia.webp', explicit: true },
  {
    file: 'billie jean - michael jackson.mp3',
    title: 'Billie Jean',
    artist: 'Michael Jackson',
    artFile: 'billie jean.jpg',
  },
  { file: 'tried our best - drake.mp3', title: 'Tried Our Best', artist: 'Drake', artFile: 'tried our best.jpeg', explicit: true },
  { file: 'what did i miss - drake.mp3', title: 'What Did I Miss', artist: 'Drake', artFile: 'what did i miss.png' },
].map((track) => ({
  ...track,
  src: `/audio/${encodeURIComponent(track.file)}`,
  artSrc: `/album-art/${encodeURIComponent(track.artFile)}`,
}));

function toTitleCase(value: string) {
  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function Home() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lifetimeVisits, setLifetimeVisits] = useState<number | null>(null);
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);
  const [tagGifKeys, setTagGifKeys] = useState<Record<string, number>>({});
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordRotation, setRecordRotation] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
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

  const socials = [
    { icon: Github, href: 'https://github.com/appleayaan', label: 'GitHub' },
    { icon: Linkedin, href: 'https://www.linkedin.com/in/ayaanfaisal18/', label: 'LinkedIn' },
    { icon: XLogoIcon, href: 'https://x.com/ayaanyyz', label: 'X' },
    { icon: Instagram, href: 'https://www.instagram.com/ayaan.visuals/', label: 'Instagram' },
    { icon: Mail, href: 'mailto:a34faisa@uwaterloo.ca', label: 'Email' },
  ];

  const currentTrack = musicTracks[currentTrackIndex];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      setCurrentTrackIndex((prev) => (prev + 1) % musicTracks.length);
      setIsPlaying(true);
    };

    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

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
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying]);

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

  const previousTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + musicTracks.length) % musicTracks.length);
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % musicTracks.length);
  };

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
    'TBD': 'https://ayaanfaisal.com',
    '@Halo Halo': 'https://halohaloapp.com',
    'WATSMyGPA': 'https://watsmygpa.me',
    'Velocity': 'https://www.velocityincubator.com/',
    '@ayaan.visuals': 'https://www.instagram.com/ayaan.visuals/',
    'UWaterloo': 'https://uwaterloo.ca',
    'X': 'https://x.com/ayaanyyz',
    'LinkedIn': 'https://www.linkedin.com/in/ayaanfaisal18/',
    'Claude Code': 'https://www.claude.ai/',
  };

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
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut', delay: 2.75 }}
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
              className="inline-block hover:text-[#688dbc] transition-colors duration-300 cursor-pointer"
         
              animate={{
                rotate: [0, -2, 1.5, -1.5, 1, 0],
                y: [0, -1, 0, 1, 0],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <b>
                <HandDrawnUnderline delay={3.2}>internships/co-ops</HandDrawnUnderline>
              </b>
            </motion.a>
          ),
          type: 'plain'
        },
        { text: 'opportunities! 🥳', type: 'plain' },
   
      ],
    },
  ];

  // --------------------------------
  // projects are sorted by date
  // --------------------------------
  const projects = [
    {
      title: 'ayaanfaisal.com',
      date: "apr '26",
      description:
        <>
          an <HandDrawnUnderline delay={0} triggerOnView>interactive and fun portfolio</HandDrawnUnderline> built with Next.js and <HandDrawnUnderline delay={0.45} triggerOnView>Tailwind CSS</HandDrawnUnderline>. check out my projects and updates!
     
     
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
          An <HandDrawnUnderline delay={0.9} triggerOnView>ML-powered</HandDrawnUnderline> platform that predicts GPA trends and provides <HandDrawnUnderline delay={1.2} triggerOnView>anonymized academic</HandDrawnUnderline> performance insights across UW programs.
     
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
          an <HandDrawnUnderline delay={1.05} triggerOnView>iOS packing assistant app</HandDrawnUnderline> designed to help users <HandDrawnUnderline delay={1.35} triggerOnView>reduce trip-prep time by 40%</HandDrawnUnderline>. PackRight is built with SwiftUI and XCode.
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
      const gifVersion = tagGifKeys[uniqueId] ?? 0;
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
          className="relative inline-block"
        >
          <a
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              hoveredTagCenterRef.current = rect.left + rect.width / 2;
              setHoveredTag(uniqueId);
              setTagGifKeys((prev) => ({
                ...prev,
                [uniqueId]: (prev[uniqueId] ?? 0) + 1,
              }));
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
            className="inline-flex items-center px-2.5 py-0.5 rounded-none text-sm lg:text-base font-medium leading-none transition-all duration-300 relative z-10 no-underline hover:no-underline focus:no-underline"
          >
            {item.icon === 'x-logo' ? (
              <svg
                viewBox="0 0 24 24"
                className="h-[0.95em] w-[0.95em]"
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
                className="h-[0.95em] w-[0.95em]"
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
                  key={gifVersion}
                  src={`/tag-gifs/tbd.gif?v=${gifVersion}`}
                  alt="tbd popup gif"
                  className="w-full h-full object-cover object-[center_70%] block"
                />
              ) : item.text === 'WATSMyGPA' ? (
                <img
                  key={gifVersion}
                  src={`/tag-gifs/watsmygpa.gif?v=${gifVersion}`}
                  alt="wats my gpa popup gif"
                  className="w-full h-full object-cover block"
                />
              ) : item.text === 'Velocity' ? (
                <img
                  key={gifVersion}
                  src={`/tag-gifs/velocity.gif?v=${gifVersion}`}
                  alt="velocity popup gif"
                  className="w-full h-full object-cover block"
                />
              ) : item.text === '@Halo Halo' ? (
                <video
                  key={gifVersion}
                  src={`/tag-gifs/halohalo.webm?v=${gifVersion}`}
                  className="w-full h-full object-cover block"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : item.text === '@ayaan.visuals' ? (
                <img
                  key={gifVersion}
                  src={`/tag-gifs/ayaan.visuals.gif?v=${gifVersion}`}
                  alt="ayaan visuals popup gif"
                  className="w-full h-full object-cover block"
                />
              ) : item.text === 'X' ? (
                <img
                  key={gifVersion}
                  src={`/tag-gifs/X.gif?v=${gifVersion}`}
                  alt="x popup gif"
                  className="w-full h-full object-cover block"
                />
              ) : typeof item.text === 'string' && item.text.replace(/[.,!?]+$/, '') === 'LinkedIn' ? (
                <img
                  key={gifVersion}
                  src={`/tag-gifs/linkedin.gif?v=${gifVersion}`}
                  alt="linkedin popup gif"
                  className="w-full h-full object-cover block"
                />
              ) : item.text === '@University' ? (
                <img
                  key={gifVersion}
                  src="/tag-gifs/uwaterloo.png"
                  alt="uwaterloo popup gif"
                  className="w-full h-full object-cover block"
                />
              ) : item.text === 'Claude Code' ? (
                <video
                  key={gifVersion}
                  src={`/tag-gifs/claude.webm?v=${gifVersion}`}
                  className="w-full h-full object-cover block"
                  autoPlay
                  loop
                  muted
                  playsInline
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Main Content Container */}
      <div className="flex flex-1">
        {/* Left Sidebar - Sticky */}
        <aside
          data-sticker-no-drop="true"
          className="hidden lg:flex lg:w-48 sticky top-0 self-start h-screen bg-background flex-col px-6 py-12 flex-shrink-0 justify-between"
        >
          {/* Top Navigation */}
          <div className="flex flex-col gap-12">
            {/* Me */}
            <Link
              href="/"
              className={`text-sm font-light transition-colors text-right block ${pathname === '/' ? 'text-foreground font-semibold scale-[1.03]' : 'text-muted-foreground/50 hover:text-muted-foreground'
                }`}
            >
              me
            </Link>

            {/* Navigation */}
            <nav className="flex flex-col gap-12 text-sm">
              <Link
                href="/experience"
                className={`font-light text-right transition-colors ${pathname === '/experience' ? 'text-foreground font-semibold scale-[1.03]' : 'text-muted-foreground/50 hover:text-muted-foreground'
                  }`}
              >
                experience
              </Link>
              <Link
                href="/projects"
                className={`font-light text-right transition-colors ${pathname === '/projects' ? 'text-foreground font-semibold scale-[1.03]' : 'text-muted-foreground/50 hover:text-muted-foreground'
                  }`}
              >
                projects
              </Link>
              <Link
                href="https://www.instagram.com/ayaan.visuals/"
                className={`font-light text-right transition-colors ${pathname === '/ayaan-visuals' ? 'text-foreground font-semibold scale-[1.03]' : 'text-muted-foreground/50 hover:text-muted-foreground'
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
                className="p-1 text-black hover:text-black/80 transition-colors cursor-pointer"
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
                className="p-1 text-black hover:text-black/80 transition-colors cursor-pointer"
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
              <p className="text-[10px] text-black">{currentTrack.artist}</p>
            </div>

            <audio ref={audioRef} preload="metadata" />
          </div>
        </aside>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed top-4 left-4 z-40 p-2 hover:bg-muted rounded-lg transition-colors"
        >
          {sidebarOpen ? <MenuX size={24} /> : <Menu size={24} />}
        </button>

        {/* Right Column */}
        <main className="flex-1">
          {/* Top Bar with Logo Badge and Social Icons */}
          <motion.div
            className="px-6 lg:px-12 py-6 flex items-center w-full"
            initial="hidden"
            animate="visible"
            variants={pageReveal}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {/* Logo Badge */}
            <div className="w-12 h-12 overflow-hidden rounded-full flex-shrink-0">
              <img
                src="/images/me.png"
                alt="Ayaan Faisal"
                className="w-full h-full object-cover block"
              />
            </div>

            {/* Social Icons + Visitors */}
            <div className="ml-auto pr-0 flex flex-col items-end gap-1.5">
              <div className="flex gap-4 items-center">
                {socials.map((social, idx) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={idx}
                      href={social.href}
                      aria-label={social.label}
                      className="text-black hover:text-neutral-700 transition-colors duration-300"
                    >
                      <Icon size={18} />
                    </a>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-500/90 font-light tracking-wide">
                lifetime visits:{' '}
                {lifetimeVisits === null ? '...' : lifetimeVisits < 0 ? 'n/a' : lifetimeVisits.toLocaleString()}
              </p>
            </div>
          </motion.div>

          {/* Hero and Content */}
          <div className="px-6 lg:px-12 pb-32">
            {/* Hero Title */}
            <motion.div
              className="-mt-2 mb-2"
              initial="hidden"
              animate="visible"
              variants={pageReveal}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.08 }}
            >
              <HoverName />
            </motion.div>

            {/* Bio section */}
            <motion.div
              className="max-w-3xl pl-1.5 pr-6 lg:pr-12"
              initial="hidden"
              animate="visible"
              variants={pageReveal}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.18 }}
            >
              <div className="text-base lg:text-lg text-foreground mb-6 font-medium tracking-tight">
                <span className="text-base lg:text-lg font-semibold">2A Math @ </span>
                <span className="relative inline-block">
                  {(() => {
                    const color = {
                      bg: '#fff2a8',
                      hoverBg: '#e0c83f',
                    };
                    const isHovered = hoveredTag === 'tag-uwaterloo';
                    const gifVersion = tagGifKeys.tagUwaterloo ?? 0;
                    return (
                      <>
                        <a
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            hoveredTagCenterRef.current =
                              rect.left + rect.width / 2;
                            setHoveredTag('tag-uwaterloo');
                            setTagGifKeys((prev) => ({
                              ...prev,
                              tagUwaterloo: (prev.tagUwaterloo ?? 0) + 1,
                            }));
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
                          className="px-3 py-1 rounded-none text-base lg:text-lg font-medium transition-none relative z-10 no-underline hover:no-underline focus:no-underline"
                        >
                          UWaterloo
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
                              key={gifVersion}
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
                <p className="text-sm lg:text-base text-muted-foreground mb-8 leading-relaxed">
                  <em>
                    "
                    <HandDrawnUnderline delay={1.95}>
                      <motion.span
                        className="inline-block bg-clip-text text-transparent"
                        style={{
                          backgroundImage: 'linear-gradient(110deg, #b18734 0%, #d8b56b 45%, #e8cf94 60%, #b18734 100%)',
                          backgroundSize: '220% 100%',
                        }}
                        animate={{ backgroundPosition: ['0% 50%', '100% 50%'] }}
                        transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
                      >
                        you can just build things
                      </motion.span>
                    </HandDrawnUnderline>
                    ..."
                  </em>
                </p>
           
              </div>

              {/* Experience List */}
              <motion.div
                className="space-y-2 text-sm lg:text-base font-medium tracking-tight mb-16"
                initial="hidden"
                animate="visible"
                variants={pageReveal}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.4, staggerChildren: 0.14 }}
              >
                {experiences.map((exp, expIdx) => (
                  <motion.div
                    key={expIdx}
                    className="flex flex-wrap items-center gap-x-0.5 gap-y-1"
                    variants={pageReveal}
                  >
                    <span className="text-muted-foreground font-medium">&gt;</span>
                    <span className="text-foreground font-medium text-inherit">{exp.title}</span>
                    <div className="flex flex-wrap gap-1.5 text-inherit">
                      {exp.items.map((item, itemIdx) => renderItem(item, itemIdx, expIdx))}
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Projects Section */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={pageReveal}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.52 }}
              >
                <h3 className="text-lg font-semibold text-foreground mb-6">projects 🚧</h3>
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  variants={pageReveal}
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.5, ease: 'easeOut', delay: 0.58, staggerChildren: 0.12 }}
                >
                  {projects.map((project, idx) => (
                    (() => {
                      const titleUnderlineDelay = idx * 0.22;
                      return (
                    <motion.div
                      key={idx}
                      className="space-y-2.5"
                      variants={pageReveal}
                      transition={{ duration: 0.45, ease: 'easeOut', staggerChildren: 0.08 }}
                    >
                      <a
                        href={project.url.href}
                        target={project.url.target}
                        rel={project.url.rel}
                        className="group block cursor-pointer"
                      >
                        <div className="aspect-video overflow-hidden rounded-lg border border-border/50 bg-secondary/40">
                          {project.mediaType === 'video' ? (
                            <video
                              src={project.gifSrc}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                              autoPlay
                              loop
                              muted
                              playsInline
                            />
                          ) : (
                            <img
                              src={project.gifSrc}
                              alt={project.gifAlt}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                            />
                          )}
                        </div>
                      </a>
                      <div className="space-y-0.5">
                        <div className="flex items-baseline justify-between gap-4">
                          <motion.a
                            href={project.url.href}
                            target={project.url.target}
                            rel={project.url.rel}
                            className="text-xl font-semibold text-foreground leading-tight hover:opacity-80 transition-opacity cursor-pointer"
                            variants={pageReveal}
                          >
                            <FlipbookTitle text={project.title} delay={titleUnderlineDelay} />
                          </motion.a>
                          <motion.span
                            className="text-2xl font-semibold text-slate-500 leading-none"
                            variants={pageReveal}
                          >
                            {project.date}
                          </motion.span>
                        </div>
                        <p className="text-base text-muted-foreground leading-relaxed">
                          {project.description}
                        </p>
                      </div>
                    </motion.div>
                      );
                    })()
                  ))}
                </motion.div>
              </motion.div>

            </motion.div>
          </div>
        </main>
      </div>

      {/* Sticker Carousel - Full Width */}
      <StickerCarousel />

      {/* Footer - Full Width */}
      <footer className="w-full border-t border-border/30 bg-background px-6 lg:px-12 py-8 flex items-center justify-between">
        {/* Left Logo */}
        <div className="w-12 h-12 overflow-hidden rounded-md flex-shrink-0">
          <img
            src="/images/logo.png"
            alt="Ayaan Faisal logo"
            className="w-full h-full object-cover block"
          />
        </div>

        {/* Copyright */}
        <div className="text-center flex-1">
          <p className="text-xs text-muted-foreground font-light transition-transform duration-300 ease-out hover:scale-105">
            © 2026 ayaanfaisal.com
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground/80 font-light">
            Designed in{' '}
            <a href="https://www.figma.com" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
              Figma
            </a>
            . Help from{' '}
            <a href="https://v0.dev" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
              v0
            </a>
            {' '}and{' '}
            <a href="https://cursor.com" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
              Cursor
            </a>
          </p>
        </div>

        {/* Right Logo */}
        <div className="w-12 h-12 bg-[#cfeefe] rounded-md flex-shrink-0 transition-colors duration-300 hover:bg-[#b9e6fb]"></div>
      </footer>
    </div>
  );
}
