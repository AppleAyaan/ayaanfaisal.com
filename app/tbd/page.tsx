import { Github, Instagram, Linkedin } from "lucide-react";

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

const socialLinks = [
  { icon: Github, href: "https://github.com/appleayaan", label: "GitHub" },
  {
    icon: Linkedin,
    href: "https://www.linkedin.com/in/ayaanfaisal18/",
    label: "LinkedIn",
  },
  { icon: XLogoIcon, href: "https://x.com/ayaanyyz", label: "X" },
  {
    icon: Instagram,
    href: "https://www.instagram.com/ayaan.visuals/",
    label: "Instagram",
  },
];

export default function TbdPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <section className="text-center">
        <h1 className="text-6xl font-medium tracking-tight leading-snug text-[#BFE7FF] transition-transform duration-300 ease-out hover:scale-[1.04] sm:text-8xl">
          coming soon.
        </h1>
        <div className="mt-6 flex items-center justify-center gap-2 sm:gap-4">
          {socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={link.label}
              className="text-foreground/85 hover:text-foreground transition-colors duration-300 inline-flex h-9 w-9 items-center justify-center rounded-full active:bg-muted/60 sm:h-auto sm:w-auto sm:rounded-none sm:active:bg-transparent"
            >
              <link.icon className="h-[18px] w-[18px]" aria-hidden />
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
