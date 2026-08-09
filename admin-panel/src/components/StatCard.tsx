import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
}

export function StatCard({ title, value, icon, description }: StatCardProps) {
  return (
    <div className="bg-card rounded-lg border p-5 flex items-start gap-4">
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-semibold mt-0.5">{value}</p>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>
    </div>
  );
}
