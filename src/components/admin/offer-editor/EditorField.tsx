import type { ReactNode } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type FieldProps = {
  id: string;
  label: string;
  hint?: string | undefined;
  characterCount?: { value: string; max: number } | undefined;
  error?: string | undefined;
  children: ReactNode;
};
export function CharacterCounter({ value, max }: { value: string; max: number }) {
  return (
    <span className="block text-right text-xs text-muted-foreground">{`${value.length}/${max} znaków`}</span>
  );
}

export function EditorField({ id, label, hint, characterCount, error, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id} className="text-sm font-semibold">
          {label}
        </Label>
        <span className="flex shrink-0 gap-2 text-xs text-muted-foreground">
          {hint ? <span>{hint}</span> : null}
          {characterCount ? <CharacterCounter {...characterCount} /> : null}
        </span>
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function SubtitleField({
  value,
  error,
  ariaError,
  disabled,
  onChange,
}: {
  value: string;
  error?: string | undefined;
  ariaError?: string | undefined;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <EditorField
      id="subtitle"
      label="Zdanie wprowadzające"
      hint="Pod tytułem oferty"
      characterCount={{ value, max: 280 }}
      error={error}
    >
      <Textarea
        id="subtitle"
        value={value}
        maxLength={280}
        className="min-h-20"
        disabled={disabled}
        aria-describedby={ariaError ? "subtitle-error" : undefined}
        aria-invalid={ariaError ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
    </EditorField>
  );
}
