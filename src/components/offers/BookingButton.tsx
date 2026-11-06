import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export function BookingButton({
  href,
  disabled,
  children,
  className,
  size = "lg",
}: {
  href: string;
  disabled: boolean;
  children: ReactNode;
  className?: string;
  size?: "default" | "lg";
}) {
  if (disabled)
    return (
      <Button
        disabled
        type="button"
        size={size}
        className={`${className ?? ""} !bg-muted !text-muted-foreground`}
      >
        {children}
      </Button>
    );
  const anchor = href === "#turnusy";
  return (
    <Button asChild size={size} className={className}>
      <a href={href} {...(!anchor ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </a>
    </Button>
  );
}
