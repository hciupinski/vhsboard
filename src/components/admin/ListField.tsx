import { useId, useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/admin/form-controls";
import { Textarea } from "@/components/admin/form-controls";
import { Label } from "@/components/ui/label";

type Props = {
  label: string;
  hint?: string | undefined;
  values: string[];
  multiline?: boolean;
  placeholder?: string;
  error?: string | undefined;
  reorderable?: boolean;
  disabled?: boolean;
  onChange: (values: string[]) => void;
};

type RowProps = {
  id: string;
  label: string;
  value: string;
  index: number;
  count: number;
  multiline?: boolean | undefined;
  placeholder?: string | undefined;
  reorderable: boolean;
  disabled: boolean;
  onEdit: (value: string) => void;
  onRemove: () => void;
  onMove: (target: number) => void;
};

function ListRow({
  id,
  label,
  value,
  index,
  count,
  multiline,
  placeholder,
  reorderable,
  disabled,
  onEdit,
  onRemove,
  onMove,
}: RowProps) {
  const sortable = useSortable({ id, disabled: disabled || !reorderable });
  const inputId = `${id}-input`;
  return (
    <div
      ref={sortable.setNodeRef}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
      }}
      className={`flex items-start gap-2 ${sortable.isDragging ? "relative z-10 opacity-70" : ""}`}
    >
      {reorderable ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          id={`${id}-handle`}
          aria-label={`Przeciągnij pozycję „${label}” ${index + 1}`}
          className="mt-1 shrink-0 touch-none cursor-grab text-muted-foreground active:cursor-grabbing"
          {...sortable.attributes}
          {...sortable.listeners}
        >
          <GripVertical className="size-4" aria-hidden="true" />
        </Button>
      ) : null}
      <Label htmlFor={inputId} className="sr-only">
        {label} {index + 1}
      </Label>
      {multiline ? (
        <Textarea
          id={inputId}
          disabled={disabled}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onEdit(e.target.value)}
          className="min-h-24"
        />
      ) : (
        <Input
          id={inputId}
          disabled={disabled}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onEdit(e.target.value)}
        />
      )}
      <div className="flex shrink-0 items-center">
        {reorderable ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled || index === 0}
              aria-label={`Przesuń pozycję „${label}” ${index + 1} w górę`}
              onClick={() => onMove(index - 1)}
            >
              <ArrowUp className="size-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled || index === count - 1}
              aria-label={`Przesuń pozycję „${label}” ${index + 1} w dół`}
              onClick={() => onMove(index + 1)}
            >
              <ArrowDown className="size-4" aria-hidden="true" />
            </Button>
          </>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Usuń pozycję „${label}” ${index + 1}`}
          disabled={disabled}
          onClick={onRemove}
          className="shrink-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function ListField({
  label,
  hint,
  values,
  multiline,
  placeholder,
  error,
  reorderable = false,
  disabled = false,
  onChange,
}: Props) {
  const listId = useId();
  const [announcement, setAnnouncement] = useState("");
  const ids = values.map((_, index) => `${listId}-item-${index}`);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const move = (from: number, to: number) => {
    if (disabled || to < 0 || to >= values.length || from === to) return;
    onChange(arrayMove(values, from, to));
    setAnnouncement(`Pozycja „${label}” przeniesiona z miejsca ${from + 1} na ${to + 1}.`);
  };
  const handleDragEnd = ({ active, over, activatorEvent }: DragEndEvent) => {
    if (!over) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from >= 0 && to >= 0) {
      move(from, to);
      if (activatorEvent instanceof KeyboardEvent && from !== to) {
        requestAnimationFrame(() => document.getElementById(`${ids[to]}-handle`)?.focus());
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label className="text-sm font-semibold">{label}</Label>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </div>
      {reorderable ? (
        <p className="text-xs text-muted-foreground">
          Przeciągnij uchwyt lub użyj strzałek, aby zmienić kolejność.
        </p>
      ) : null}
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        accessibility={{
          screenReaderInstructions: {
            draggable:
              "Naciśnij spację, aby rozpocząć przenoszenie. Użyj strzałek, aby zmienić pozycję, spacji, aby zatwierdzić, lub Escape, aby anulować.",
          },
          announcements: {
            onDragStart: ({ active }) =>
              `Przenoszenie pozycji ${ids.indexOf(String(active.id)) + 1} na liście ${label}.`,
            onDragOver: ({ over }) =>
              over ? `Pozycja docelowa: ${ids.indexOf(String(over.id)) + 1}.` : "Poza listą.",
            onDragEnd: ({ over }) =>
              over ? "Przenoszenie zakończone." : "Przenoszenie anulowane.",
            onDragCancel: () => "Przenoszenie anulowane.",
          },
        }}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {values.map((value, index) => (
              <ListRow
                key={ids[index]}
                id={ids[index]!}
                label={label}
                value={value}
                index={index}
                count={values.length}
                multiline={multiline}
                placeholder={placeholder}
                reorderable={reorderable}
                disabled={disabled}
                onEdit={(next) => onChange(values.map((item, i) => (i === index ? next : item)))}
                onRemove={() => onChange(values.filter((_, i) => i !== index))}
                onMove={(target) => {
                  move(index, target);
                  requestAnimationFrame(() =>
                    document.getElementById(`${ids[target]}-input`)?.focus(),
                  );
                }}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-full"
        disabled={disabled}
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
