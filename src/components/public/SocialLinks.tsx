import { cn } from "@/lib/utils";

type SocialLinksProps = {
  className?: string;
};

const linkClassName =
  "inline-flex size-9 items-center justify-center rounded-full bg-background/90 text-foreground transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:text-primary";

export function SocialLinks({ className }: SocialLinksProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <a
        href="https://www.facebook.com/share/1E7xY7Ed2B"
        className={linkClassName}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Facebook"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-5" aria-hidden="true">
          <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.025 4.388 11.02 10.125 11.927v-8.437H7.078v-3.49h3.047V9.413c0-3.025 1.792-4.697 4.533-4.697 1.313 0 2.686.235 2.686.235v2.97h-1.513c-1.49 0-1.956.928-1.956 1.88v2.272h3.328l-.532 3.49h-2.796V24C19.612 23.093 24 18.098 24 12.073Z" />
        </svg>
      </a>
      <a
        href="https://www.instagram.com/vhsboard"
        className={linkClassName}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-5" aria-hidden="true">
          <path d="M7.5 2C4.46 2 2 4.46 2 7.5v9C2 19.54 4.46 22 7.5 22h9c3.04 0 5.5-2.46 5.5-5.5v-9C22 4.46 19.54 2 16.5 2h-9ZM17 5.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
        </svg>
      </a>
    </div>
  );
}
