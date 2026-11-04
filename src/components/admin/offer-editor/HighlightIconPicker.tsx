import { Ban } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HIGHLIGHT_ICONS, getHighlightIcon } from "@/lib/offers/highlight-icons";

type Props = {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
};

export function HighlightIconPicker({ label, value, disabled, onChange }: Props) {
  const selected = getHighlightIcon(value);
  const SelectedIcon = selected.icon ?? Ban;
  return (
    <Select value={selected.value} disabled={disabled} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="h-10 w-36 shrink-0 bg-card">
        <SelectValue>
          <span className="flex items-center gap-2">
            <SelectedIcon aria-hidden="true" className="size-4 shrink-0 text-primary" />
            <span className="truncate">{selected.label}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {HIGHLIGHT_ICONS.map(({ value: iconValue, label: iconLabel, icon: Icon }) => {
          const Preview = Icon ?? Ban;
          return (
            <SelectItem key={iconValue} value={iconValue}>
              <span className="flex items-center gap-2">
                <Preview aria-hidden="true" className="size-4 shrink-0" />
                {iconLabel}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
