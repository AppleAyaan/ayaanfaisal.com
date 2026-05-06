'use client';

/**
 * Global command palette behavior + command registry.
 * Edit here to add/remove shortcuts, navigation commands, and music quick actions.
 * This component dispatches command events consumed by app/page.tsx.
 */

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Briefcase,
  ChevronUp,
  ChevronsDown,
  Copy,
  Download,
  ExternalLink,
  FolderKanban,
  Github,
  Home,
  Instagram,
  Linkedin,
  Music,
  MoonStar,
  Play,
  SkipBack,
  SkipForward,
  Sun,
} from 'lucide-react';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { applyThemeWithEntranceReplay } from '@/lib/theme-transition';
import { useThemeEntranceReplay } from '@/components/theme-entrance-replay';

type PaletteCommand = {
  id: string;
  label: string;
  keywords?: string;
  section: 'Pages' | 'Social Links' | 'Music' | 'Actions';
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  run: () => Promise<void> | void;
};

function XLogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        fill="currentColor"
        d="M18.18 3H21l-7.76 8.87L22.36 21H16.7l-5.45-6.84L5.25 21H2.43l8.14-9.31L1.64 3h5.82l5 6.28L18.18 3Zm-1.24 16h1.57L6.54 5H4.82l12.12 14Z"
      />
    </svg>
  );
}

const EMAIL = 'a34faisa@uwaterloo.ca';
const GITHUB_URL = 'https://github.com/appleayaan';
const LINKEDIN_URL = 'https://www.linkedin.com/in/ayaanfaisal18/';
const X_URL = 'https://x.com/ayaanyyz';
const INSTAGRAM_URL = 'https://www.instagram.com/ayaan.visuals/';
const RESUME_PATH = '/resume.pdf';

export default function CommandPalette() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const { resolvedTheme, setTheme } = useTheme();
  const { bumpEntranceAnimations } = useThemeEntranceReplay();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [statusText, setStatusText] = useState<string>('');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isK = event.key.toLowerCase() === 'k';
      const hasModifier = event.metaKey || event.ctrlKey;
      if (hasModifier && isK) {
        event.preventDefault();
        setOpen((prev) => !prev);
      } else if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const openHandler = () => setOpen(true);
    window.addEventListener('open-command-palette', openHandler);
    return () => window.removeEventListener('open-command-palette', openHandler);
  }, []);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  useEffect(() => {
    if (!statusText) return;
    const timeout = window.setTimeout(() => setStatusText(''), 1400);
    return () => window.clearTimeout(timeout);
  }, [statusText]);

  const commands = useMemo<PaletteCommand[]>(
    () => [
      {
        id: 'nav-home',
        label: 'Go to home',
        keywords: 'index landing me',
        section: 'Pages',
        icon: Home,
        shortcut: 'G H',
        run: () => {
          router.push('/');
          setOpen(false);
        },
      },
      {
        id: 'nav-projects',
        label: 'Go to projects',
        keywords: 'portfolio work build ship',
        section: 'Pages',
        icon: FolderKanban,
        shortcut: 'G P',
        run: () => {
          router.push('/projects');
          setOpen(false);
        },
      },
      {
        id: 'nav-experience',
        label: 'Go to experience',
        keywords: 'jobs internships co-op career',
        section: 'Pages',
        icon: Briefcase,
        shortcut: 'G E',
        run: () => {
          router.push('/experience');
          setOpen(false);
        },
      },
      {
        id: 'social-github',
        label: 'Open GitHub',
        keywords: 'code repositories profile',
        section: 'Social Links',
        icon: Github,
        run: () => {
          window.open(GITHUB_URL, '_blank', 'noopener,noreferrer');
          setOpen(false);
        },
      },
      {
        id: 'social-linkedin',
        label: 'Open LinkedIn',
        keywords: 'network profile career',
        section: 'Social Links',
        icon: Linkedin,
        run: () => {
          window.open(LINKEDIN_URL, '_blank', 'noopener,noreferrer');
          setOpen(false);
        },
      },
      {
        id: 'social-x',
        label: 'Open X',
        keywords: 'twitter social',
        section: 'Social Links',
        icon: XLogoIcon,
        run: () => {
          window.open(X_URL, '_blank', 'noopener,noreferrer');
          setOpen(false);
        },
      },
      {
        id: 'social-instagram',
        label: 'Open Instagram',
        keywords: 'ayaan visuals',
        section: 'Social Links',
        icon: Instagram,
        run: () => {
          window.open(INSTAGRAM_URL, '_blank', 'noopener,noreferrer');
          setOpen(false);
        },
      },
      {
        id: 'action-copy-email',
        label: 'Copy email',
        keywords: 'contact mail copy',
        section: 'Actions',
        icon: Copy,
        run: async () => {
          try {
            await navigator.clipboard.writeText(EMAIL);
            setStatusText('Email copied');
          } catch {
            setStatusText('Unable to copy email');
          }
          setOpen(false);
        },
      },
      {
        id: 'action-download-resume',
        label: 'Download resume',
        keywords: 'cv pdf file',
        section: 'Actions',
        icon: Download,
        run: () => {
          window.open(RESUME_PATH, '_blank', 'noopener,noreferrer');
          setOpen(false);
        },
      },
      {
        id: 'action-toggle-dark',
        label: 'Toggle light/dark mode',
        keywords: 'theme light dark appearance',
        section: 'Actions',
        icon: resolvedTheme === 'dark' ? Sun : MoonStar,
        run: () => {
          const next = resolvedTheme === 'dark' ? 'light' : 'dark';
          applyThemeWithEntranceReplay(setTheme, next, bumpEntranceAnimations);
          setStatusText(next === 'dark' ? 'Dark mode enabled' : 'Light mode enabled');
          setOpen(false);
        },
      },
      {
        id: 'action-play-pause',
        label: 'Play / Pause music',
        keywords: 'audio player controls',
        section: 'Music',
        icon: Play,
        run: () => {
          window.dispatchEvent(new Event('command-music-toggle'));
          setOpen(false);
        },
      },
      {
        id: 'action-next-track',
        label: 'Next track',
        keywords: 'audio player skip forward',
        section: 'Music',
        icon: SkipForward,
        run: () => {
          window.dispatchEvent(new Event('command-music-next'));
          setOpen(false);
        },
      },
      {
        id: 'action-previous-track',
        label: 'Previous track',
        keywords: 'audio player skip back',
        section: 'Music',
        icon: SkipBack,
        run: () => {
          window.dispatchEvent(new Event('command-music-previous'));
          setOpen(false);
        },
      },
      {
        id: 'action-scroll-top',
        label: 'Scroll to top',
        keywords: 'go up',
        section: 'Actions',
        icon: ChevronUp,
        run: () => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setOpen(false);
        },
      },
      {
        id: 'action-scroll-carousel',
        label: 'Scroll to sticker carousel',
        keywords: 'stickers section',
        section: 'Actions',
        icon: ChevronsDown,
        run: () => {
          const section = document.getElementById('sticker-carousel-section');
          if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          setOpen(false);
        },
      },
      {
        id: 'action-ovo',
        label: "I’m feeling OVO 𓅓",
        keywords: 'drake music',
        section: 'Music',
        icon: Music,
        run: () => {
          window.dispatchEvent(new Event('command-music-ovo'));
          setStatusText('Queued a Drake track');
          setOpen(false);
        },
      },
    ],
    [router, setTheme, resolvedTheme, bumpEntranceAnimations]
  );

  const commandSections: Array<PaletteCommand['section']> = [
    'Pages',
    'Social Links',
    'Music',
    'Actions',
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-2xl overflow-hidden border-border/60 bg-background/95 p-0 text-foreground shadow-2xl backdrop-blur-md"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Command palette</DialogTitle>
            <DialogDescription>
              Search and run commands with keyboard navigation.
            </DialogDescription>
          </DialogHeader>

          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 360, damping: 28, mass: 0.85 }
            }
            className="w-full"
          >
            <Command shouldFilter className="overflow-hidden rounded-2xl bg-transparent text-foreground">
              <CommandInput
                value={query}
                onValueChange={setQuery}
                aria-label="Search commands"
                placeholder="Search commands..."
                className="text-base text-foreground placeholder:text-muted-foreground"
              />
              <CommandList className="max-h-[55vh] py-2">
                <CommandEmpty className="text-muted-foreground">
                  No matching commands.
                </CommandEmpty>
                {commandSections.map((section, index) => (
                  <div key={section}>
                    {index > 0 ? <CommandSeparator className="my-1 bg-border/70" /> : null}
                    <CommandGroup heading={section}>
                      {commands
                        .filter((command) => command.section === section)
                        .map((command) => {
                          const Icon = command.icon;
                          return (
                            <CommandItem
                              key={command.id}
                              value={`${command.label} ${command.keywords ?? ''}`}
                              onSelect={() => void command.run()}
                              className="group mx-1 cursor-pointer rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ease-out hover:-translate-y-[1px] hover:scale-[1.01] hover:bg-accent/80 hover:shadow-sm data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                            >
                              <Icon className="h-4 w-4 text-muted-foreground transition-all duration-200 ease-out group-hover:scale-110 group-hover:text-foreground group-data-[selected=true]:scale-110 group-data-[selected=true]:text-foreground" />
                              <span>{command.label}</span>
                              {command.shortcut ? (
                                <CommandShortcut className="text-[10px] text-muted-foreground/80">
                                  {command.shortcut}
                                </CommandShortcut>
                              ) : command.section === 'Social Links' ? (
                                <ExternalLink className="ml-auto h-3.5 w-3.5 text-muted-foreground/80 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-data-[selected=true]:translate-x-0.5" />
                              ) : null}
                            </CommandItem>
                          );
                        })}
                    </CommandGroup>
                  </div>
                ))}
              </CommandList>
              <div className="flex items-center justify-between border-t border-border/70 px-3 py-2 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
                      applyThemeWithEntranceReplay(
                        setTheme,
                        nextTheme,
                        bumpEntranceAnimations
                      );
                      setStatusText(
                        nextTheme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled'
                      );
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border/80 px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
                    title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
                  >
                    {resolvedTheme === 'dark' ? (
                      <Sun className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <MoonStar className="h-3.5 w-3.5" aria-hidden />
                    )}
                    <span>{resolvedTheme === 'dark' ? 'Light' : 'Dark'}</span>
                  </button>
                  <span aria-live="polite">{statusText || 'Use ↑ ↓ to navigate, Enter to run'}</span>
                </div>
                <span className="rounded border border-border/80 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  esc
                </span>
              </div>
            </Command>
          </motion.div>
        </DialogContent>
      </Dialog>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="sr-only"
        aria-label="Open command palette"
      >
        Open command palette
      </button>
    </>
  );
}
