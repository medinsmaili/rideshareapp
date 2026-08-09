import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  confirmed: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  resolved: "bg-muted text-muted-foreground border-border",
  dismissed: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={`capitalize text-xs font-medium ${statusStyles[status] ?? ""}`}>
      {status}
    </Badge>
  );
}
