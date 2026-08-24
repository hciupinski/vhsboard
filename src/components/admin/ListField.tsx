import { useId } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Props = {
  label: string;
  hint?: string;
  values: string[];
  multiline?: boolean;
  placeholder?: string;
  error?: string;
  onChange: (values: string[]) => void;
};

export function ListField({ label, hint, values, multiline, placeholder, error, onChange }: Props) {
  const listId = useId();
  const set = (i: number, v: string) => onChange(values.map((x, j) => (j === i ? v : x)));
  const remove = (i: number) => onChange(values.filter((_, j) => j !== i));

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label className="text-sm font-semibold">{label}</Label>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </div>
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex items-start gap-2">
            <Label htmlFor={`${listId}-item-${i}`} className="sr-only">
              {label} {i + 1}
            </Label>
            {multiline ? (
              <Textarea
                id={`${listId}-item-${i}`}
                value={v}
                placeholder={placeholder}
                onChange={(e) => set(i, e.target.value)}
                className="min-h-24"
              />
            ) : (
              <Input
                id={`${listId}-item-${i}`}
                value={v}
                placeholder={placeholder}
                onChange={(e) => set(i, e.target.value)}
              />
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Usuń pozycję „${label}” ${i + 1}`}
              onClick={() => remove(i)}
              className="mt-1 shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-full"
        onClick={() => onChange([...values, ""])}
      >
        <Plus className="mr-1 size-4" /> Dodaj pozycję
      </Button>
      {error ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
