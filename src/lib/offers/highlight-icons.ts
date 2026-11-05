import {
  Bike,
  Camera,
  Coffee,
  Dumbbell,
  Flame,
  Mountain,
  Music,
  Snowflake,
  Sparkles,
  Sun,
  Trophy,
  Users,
  Utensils,
  Waves,
  type LucideIcon,
} from "lucide-react";

export const HIGHLIGHT_ICONS: ReadonlyArray<{
  value: string;
  label: string;
  icon: LucideIcon | null;
}> = [
  { value: "sparkles", label: "Gwiazdki", icon: Sparkles },
  { value: "none", label: "Bez ikony", icon: null },
  { value: "utensils", label: "Posiłek", icon: Utensils },
  { value: "sun", label: "Słońce", icon: Sun },
  { value: "waves", label: "Fale i woda", icon: Waves },
  { value: "snowflake", label: "Śnieg", icon: Snowflake },
  { value: "mountain", label: "Góry", icon: Mountain },
  { value: "flame", label: "Ognisko", icon: Flame },
  { value: "trophy", label: "Zawody", icon: Trophy },
  { value: "users", label: "Grupa", icon: Users },
  { value: "dumbbell", label: "Trening", icon: Dumbbell },
  { value: "bike", label: "Rower", icon: Bike },
  { value: "camera", label: "Zdjęcia i wideo", icon: Camera },
  { value: "music", label: "Muzyka", icon: Music },
  { value: "coffee", label: "Odpoczynek", icon: Coffee },
];
export const DEFAULT_HIGHLIGHT_ICON = "sparkles";
export function getHighlightIcon(value: string | undefined) {
  return HIGHLIGHT_ICONS.find((item) => item.value === value) ?? HIGHLIGHT_ICONS[0]!;
}
