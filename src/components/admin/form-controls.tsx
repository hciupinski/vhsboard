import * as React from "react";

import { Input as BaseInput } from "@/components/ui/input";
import { Textarea as BaseTextarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<typeof BaseInput>>(
  ({ className, ...props }, ref) => (
    <BaseInput ref={ref} className={cn("bg-card", className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<typeof BaseTextarea>
>(({ className, ...props }, ref) => (
  <BaseTextarea ref={ref} className={cn("bg-card", className)} {...props} />
));
Textarea.displayName = "Textarea";
