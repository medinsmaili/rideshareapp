import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { X, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  count: number;
  total?: number;
  onClear: () => void;
  onSelectAllVisible?: () => void;
  visibleCount?: number;
  children?: ReactNode;
  className?: string;
};

/**
 * Sticky/inline bar that appears when rows are selected. Shows count, a
 * "select all visible" affordance, and a slot for bulk action buttons.
 */
export function BulkActionBar({
  count,
  total,
  onClear,
  onSelectAllVisible,
  visibleCount,
  children,
  className,
}: Props) {
  if (count === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 px-4 py-2.5 border-b bg-primary/5 border-primary/20",
        className
      )}
    >
      <div className="flex items-center gap-2 mr-auto">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={onClear}
          title="Clear selection"
        >
          <X className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium text-foreground">
          {count} selected
          {typeof total === "number" && total !== count && (
            <span className="text-muted-foreground"> of {total}</span>
          )}
        </span>
        {onSelectAllVisible &&
          typeof visibleCount === "number" &&
          visibleCount > count && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-primary hover:text-primary"
              onClick={onSelectAllVisible}
            >
              <CheckSquare className="h-3.5 w-3.5 mr-1" />
              Select all {visibleCount} visible
            </Button>
          )}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
